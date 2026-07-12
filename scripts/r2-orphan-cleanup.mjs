import { createHash } from 'node:crypto'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Pool } from 'pg'

const QUARANTINE_PREFIX = '_r2-orphan-quarantine/'
const MANIFEST_PREFIX = '_r2-orphan-manifests/'
const BATCH_SIZE = 1
const DAY = 24 * 60 * 60 * 1000
// Stable PostgreSQL bigint namespace for this application-wide cleanup job.
// All replicas must use this exact value to contend for the same DB session lock.
export const R2_CLEANUP_ADVISORY_LOCK_KEY = '482912076143587201'

export function batches(items, size = BATCH_SIZE) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  )
}

export function selectCandidates(objects, referencedKeys, cutoff) {
  return objects.filter(
    (object) =>
      object.Key &&
      !isReservedKey(object.Key) &&
      !referencedKeys.has(object.Key) &&
      object.LastModified instanceof Date &&
      object.LastModified.getTime() < cutoff.getTime() &&
      isCurrentUploadKey(object.Key) &&
      typeof object.ETag === 'string',
  )
}

export function isCurrentUploadKey(key) {
  return /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/.test(
    key,
  )
}

export function isReservedKey(key) {
  return key.startsWith(QUARANTINE_PREFIX) || key.startsWith(MANIFEST_PREFIX)
}

export function selectManualReview(objects, referencedKeys, cutoff) {
  return objects
    .filter(
      (object) =>
        object.Key &&
        !isReservedKey(object.Key) &&
        !referencedKeys.has(object.Key) &&
        object.LastModified instanceof Date &&
        object.LastModified.getTime() < cutoff.getTime() &&
        (!isCurrentUploadKey(object.Key) || typeof object.ETag !== 'string'),
    )
    .map((object) => ({
      key: object.Key,
      reason: isCurrentUploadKey(object.Key)
        ? 'missing_listed_etag'
        : 'legacy_or_unknown_key',
      size: object.Size ?? 0,
      lastModified: object.LastModified.toISOString(),
      etag: object.ETag ?? null,
    }))
}

export function keyFromPublicUrl(value, publicUrl) {
  if (!value || !publicUrl) return null
  try {
    const source = new URL(value)
    const base = new URL(publicUrl)
    if (
      base.search ||
      base.hash ||
      source.origin !== base.origin ||
      source.search ||
      source.hash
    )
      return null
    const basePath = normalizeUrlPath(base.pathname).replace(/\/+$/, '')
    const sourcePath = normalizeUrlPath(source.pathname)
    const prefix = `${basePath}/`.replace(/^\//, '/')
    if (!sourcePath.startsWith(prefix)) return null
    const key = decodeURIComponent(sourcePath.slice(prefix.length))
    return key && !key.startsWith('/') ? key : null
  } catch {
    return null
  }
}

function normalizeUrlPath(pathname) {
  return `/${pathname}`.replace(/\/{2,}/g, '/')
}

export function candidateManifest(config, candidates, manualReview = []) {
  const entries = candidates
    .map((object) => ({
      key: object.Key,
      size: object.Size ?? 0,
      lastModified: object.LastModified.toISOString(),
      etag: object.ETag,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
  const canonical = JSON.stringify({
    bucket: config.bucket,
    scope: config.scope,
    cutoff: config.cutoff.toISOString(),
    entries,
    manualReview,
  })
  const digest = createHash('sha256').update(canonical).digest('hex')
  const runId = digest.slice(0, 16)
  return {
    event: 'r2_orphan_candidate_manifest',
    runId,
    digest,
    quarantinePrefix: `${QUARANTINE_PREFIX}${runId}/`,
    bucket: config.bucket,
    scope: config.scope,
    cutoff: config.cutoff.toISOString(),
    entries,
    manualReview,
    manifestKey: `${MANIFEST_PREFIX}${runId}.json`,
  }
}

function requiredEnv(environment, name) {
  const value = environment[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function positiveInteger(environment, name, fallback) {
  const value = environment[name] ?? String(fallback)
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(`${name} must be a positive integer`)
  }
  return Number(value)
}

export function cleanupConfig(
  args,
  environment = process.env,
  now = Date.now(),
) {
  if (args.includes('--help')) return { help: true }
  if (args.some((arg) => arg !== '--delete'))
    throw new Error('Usage: node scripts/r2-orphan-cleanup.mjs [--delete]')

  const bucket = requiredEnv(environment, 'R2_BUCKET_NAME')
  const prefix = environment.R2_CLEANUP_PREFIX ?? ''
  if (prefix.startsWith(QUARANTINE_PREFIX)) {
    throw new Error(
      `R2_CLEANUP_PREFIX must not target reserved ${QUARANTINE_PREFIX}`,
    )
  }
  const scope = `${bucket}:${prefix || '*'}`
  const deleting = args.includes('--delete')
  if (deleting && environment.R2_CLEANUP_CONFIRM_SCOPE !== scope) {
    throw new Error(
      `Quarantine requires R2_CLEANUP_CONFIRM_SCOPE to exactly equal ${scope}`,
    )
  }
  const graceDays = positiveInteger(environment, 'R2_CLEANUP_GRACE_DAYS', 7)
  const deadlineMinutes = positiveInteger(
    environment,
    'R2_CLEANUP_DEADLINE_MINUTES',
    20,
  )
  requiredEnv(environment, 'R2_PUBLIC_URL')
  return {
    bucket,
    prefix,
    scope,
    deleting,
    graceDays,
    deadlineMinutes,
    cutoff: new Date(now - graceDays * DAY),
    publicUrl: environment.R2_PUBLIC_URL.replace(/\/+$/, ''),
    dbTimeoutMillis: positiveInteger(
      environment,
      'R2_CLEANUP_DB_TIMEOUT_MS',
      10_000,
    ),
  }
}

function r2Client(environment) {
  const rawAccountId =
    environment.CLOUDFLARE_ACCOUNT_ID || environment.R2_ACCOUNT_ID || ''
  const accountId = rawAccountId.replace(/^https?:\/\//, '').split('.')[0]
  if (!accountId)
    throw new Error('R2_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID is required')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv(environment, 'R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv(environment, 'R2_SECRET_ACCESS_KEY'),
    },
  })
}

export function remainingDeadlineMillis(deadlineAt, now = Date.now()) {
  const remaining = deadlineAt - now
  if (remaining <= 0) throw new Error('R2 cleanup deadline exceeded')
  return remaining
}

export function databaseTimeoutMillis(deadlineAt, configuredTimeout, now) {
  return Math.min(remainingDeadlineMillis(deadlineAt, now), configuredTimeout)
}

export async function readReferences(
  pool,
  publicUrl,
  { deadlineAt, dbTimeoutMillis } = {},
) {
  if (!deadlineAt || !dbTimeoutMillis)
    throw new Error('R2 cleanup database deadline is required')
  const ownsClient =
    typeof pool.connect === 'function' && typeof pool.release !== 'function'
  const db = ownsClient
    ? await withinDeadline(pool.connect(), deadlineAt)
    : pool
  try {
    const timeout = databaseTimeoutMillis(deadlineAt, dbTimeoutMillis)
    const references = await db.query({
      text: `SELECT "imageKey" AS key, NULL::text AS legacy_image FROM categories
             UNION ALL SELECT key, NULL::text FROM images
             UNION ALL SELECT NULL::text, image FROM categories`,
      query_timeout: timeout,
    })
    return new Set(
      references.rows.flatMap(({ key, legacy_image: legacyImage }) =>
        [key, keyFromPublicUrl(legacyImage, publicUrl)].filter(Boolean),
      ),
    )
  } finally {
    if (ownsClient) db.release()
  }
}

export async function listObjects(client, bucket, prefix, signal) {
  const objects = []
  const tokens = new Set()
  let continuationToken
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ...(prefix ? { Prefix: prefix } : {}),
        ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
      }),
      { abortSignal: signal },
    )
    objects.push(...(page.Contents ?? []))
    if (!page.IsTruncated) break
    continuationToken = page.NextContinuationToken
    if (!continuationToken || tokens.has(continuationToken))
      throw new Error('R2 pagination did not advance')
    tokens.add(continuationToken)
  } while (true)
  return objects.filter((object) => object.Key)
}

function copySource(bucket, key) {
  return `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, '/')}`
}

export async function quarantineObject(client, config, object, signal) {
  const target = `${config.quarantinePrefix}${object.Key}`
  const beforeCopy = await headObject(client, config.bucket, object.Key, signal)
  if (!sameObject(beforeCopy, object)) return null
  await client.send(
    new CopyObjectCommand({
      Bucket: config.bucket,
      Key: target,
      CopySource: copySource(config.bucket, object.Key),
      CopySourceIfMatch: beforeCopy.ETag,
      MetadataDirective: 'COPY',
    }),
    { abortSignal: signal },
  )
  const beforeDelete = await headObject(
    client,
    config.bucket,
    object.Key,
    signal,
  )
  if (!sameObject(beforeDelete, object)) return null
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: object.Key }),
    { abortSignal: signal },
  )
  return target
}

export async function headObject(client, bucket, key, signal) {
  return client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }), {
    abortSignal: signal,
  })
}

export function sameObject(head, object) {
  return (
    head.ETag === object.ETag &&
    head.LastModified instanceof Date &&
    object.LastModified instanceof Date &&
    head.LastModified.getTime() === object.LastModified.getTime()
  )
}

export async function persistManifest(client, config, manifest, signal) {
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: manifest.manifestKey,
      Body: JSON.stringify(manifest),
      ContentType: 'application/json',
    }),
    { abortSignal: signal },
  )
}

function summary(config, result) {
  return {
    event: 'r2_orphan_cleanup_summary',
    mode: config.deleting ? 'quarantine' : 'dry-run',
    bucket: config.bucket,
    scope: config.scope,
    ...(config.runId
      ? { runId: config.runId, quarantinePrefix: config.quarantinePrefix }
      : {}),
    scanned: result.scanned,
    referenced: result.referenced,
    protectedRecent: result.protectedRecent,
    candidates: result.candidates,
    candidateBytes: result.candidateBytes,
    quarantined: result.quarantined,
    quarantinedBytes: result.quarantinedBytes,
    skippedReferenced: result.skippedReferenced,
    errors: result.errors,
    manualReview: result.manualReview,
  }
}

export async function executeCleanup({
  config,
  client,
  getReferences,
  list,
  log = console.log,
  signal,
}) {
  const result = {
    scanned: 0,
    referenced: 0,
    protectedRecent: 0,
    candidates: 0,
    candidateBytes: 0,
    quarantined: 0,
    quarantinedBytes: 0,
    skippedReferenced: 0,
    errors: 0,
    manualReview: 0,
  }
  const [references, objects] = await Promise.all([getReferences(), list()])
  const candidates = selectCandidates(objects, references, config.cutoff)
  const manualReview = selectManualReview(objects, references, config.cutoff)
  const manifest = candidateManifest(config, candidates, manualReview)
  const runConfig = {
    ...config,
    runId: manifest.runId,
    quarantinePrefix: manifest.quarantinePrefix,
  }
  result.scanned = objects.length
  result.referenced = references.size
  result.protectedRecent = objects.filter(
    (object) =>
      object.Key &&
      !object.Key.startsWith(QUARANTINE_PREFIX) &&
      !references.has(object.Key) &&
      (!(object.LastModified instanceof Date) ||
        object.LastModified >= config.cutoff),
  ).length
  result.candidates = candidates.length
  result.manualReview = manualReview.length
  result.candidateBytes = candidates.reduce(
    (total, object) => total + (object.Size ?? 0),
    0,
  )
  log(JSON.stringify(manifest))
  if (!runConfig.deleting) {
    log(JSON.stringify(summary(runConfig, result)))
    return result
  }

  await persistManifest(client, runConfig, manifest, signal)
  log(JSON.stringify({ event: 'r2_orphan_manifest_persisted', ...manifest }))

  for (const batch of batches(candidates)) {
    if (signal?.aborted)
      throw signal.reason ?? new Error('R2 cleanup deadline exceeded')
    const object = batch[0]
    const latestReferences = await getReferences()
    const eligible = latestReferences.has(object.Key) ? [] : [object]
    result.skippedReferenced += batch.length - eligible.length
    for (const object of eligible) {
      const quarantineKey = await quarantineObject(
        client,
        runConfig,
        object,
        signal,
      )
      if (!quarantineKey) {
        result.errors += 1
        log(
          JSON.stringify({
            event: 'r2_orphan_identity_changed',
            runId: runConfig.runId,
            sourceKey: object.Key,
          }),
        )
        continue
      }
      log(
        JSON.stringify({
          event: 'r2_orphan_quarantined',
          runId: runConfig.runId,
          sourceKey: object.Key,
          quarantineKey,
        }),
      )
      result.quarantined += 1
      result.quarantinedBytes += object.Size ?? 0
    }
  }
  log(JSON.stringify(summary(runConfig, result)))
  return result
}

export async function acquireCleanupLock(pool, deadlineAt, dbTimeoutMillis) {
  const client = await withinDeadline(pool.connect(), deadlineAt)
  try {
    const timeout = databaseTimeoutMillis(deadlineAt, dbTimeoutMillis)
    const result = await client.query({
      text: 'SELECT pg_try_advisory_lock($1::bigint) AS acquired',
      values: [R2_CLEANUP_ADVISORY_LOCK_KEY],
      query_timeout: timeout,
    })
    if (!result.rows[0]?.acquired) throw new Error('another cleanup is running')
    return client
  } catch (error) {
    client.release(true)
    throw error
  }
}

export async function withCleanupLock(
  pool,
  { deadlineAt, dbTimeoutMillis },
  work,
) {
  let lockClient
  try {
    lockClient = await acquireCleanupLock(pool, deadlineAt, dbTimeoutMillis)
    return await work(lockClient)
  } finally {
    if (lockClient) lockClient.release(true)
  }
}

export async function withinDeadline(work, deadlineAt) {
  const remaining = remainingDeadlineMillis(deadlineAt)
  let timer
  try {
    return await Promise.race([
      work,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('R2 cleanup deadline exceeded')),
          remaining,
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export async function cleanupResources(pool, timeoutMillis = 5_000) {
  const deadlineAt = Date.now() + timeoutMillis
  let poolError
  try {
    if (pool) await withinDeadline(pool.end(), deadlineAt)
  } catch (error) {
    poolError = error
  }

  if (poolError) {
    throw new AggregateError([poolError], 'R2 cleanup resource shutdown failed')
  }
}

export async function main(
  args = process.argv.slice(2),
  environment = process.env,
) {
  const config = cleanupConfig(args, environment)
  if (config.help) {
    console.log(
      'Usage: node scripts/r2-orphan-cleanup.mjs [--delete]\n--delete quarantines objects; it never immediately purges storage.',
    )
    return
  }
  const deadlineAt = Date.now() + config.deadlineMinutes * 60 * 1000
  let pool
  try {
    pool = new Pool({
      connectionString: requiredEnv(environment, 'DATABASE_URL'),
      connectionTimeoutMillis: databaseTimeoutMillis(
        deadlineAt,
        config.dbTimeoutMillis,
      ),
      statement_timeout: databaseTimeoutMillis(
        deadlineAt,
        config.dbTimeoutMillis,
      ),
      query_timeout: databaseTimeoutMillis(deadlineAt, config.dbTimeoutMillis),
    })
    const result = await withCleanupLock(
      pool,
      { deadlineAt, dbTimeoutMillis: config.dbTimeoutMillis },
      async (lockClient) => {
        const controller = new AbortController()
        const timer = setTimeout(
          () => controller.abort(new Error('R2 cleanup deadline exceeded')),
          remainingDeadlineMillis(deadlineAt),
        )
        try {
          const client = r2Client(environment)
          return await executeCleanup({
            config,
            client,
            getReferences: () =>
              readReferences(lockClient, config.publicUrl, {
                deadlineAt,
                dbTimeoutMillis: config.dbTimeoutMillis,
              }),
            list: () =>
              listObjects(
                client,
                config.bucket,
                config.prefix,
                controller.signal,
              ),
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timer)
        }
      },
    )
    if (result.errors) process.exitCode = 1
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'r2_orphan_cleanup_error',
        message: error instanceof Error ? error.message : 'R2 cleanup failed',
      }),
    )
    process.exitCode = 1
  } finally {
    try {
      await cleanupResources(pool)
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'r2_orphan_cleanup_error',
          message:
            error instanceof Error
              ? error.message
              : 'R2 cleanup shutdown failed',
        }),
      )
      process.exitCode = 1
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: 'r2_orphan_cleanup_error',
        message: error instanceof Error ? error.message : 'R2 cleanup failed',
      }),
    )
    process.exitCode = 1
  })
}
