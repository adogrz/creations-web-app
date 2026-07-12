import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import {
  R2_CLEANUP_ADVISORY_LOCK_KEY,
  acquireCleanupLock,
  candidateManifest,
  cleanupConfig,
  cleanupResources,
  executeCleanup,
  keyFromPublicUrl,
  listObjects,
  quarantineObject,
  readReferences,
  remainingDeadlineMillis,
  selectCandidates,
  selectManualReview,
  withinDeadline,
  withCleanupLock,
} from './r2-orphan-cleanup.mjs'

const cutoff = new Date('2026-07-11T00:00:00.000Z')
const immutable = {
  Key: 'uploads/01234567-89ab-4cde-8fab-0123456789ab.webp',
  Size: 4,
  LastModified: new Date('2026-07-10T23:59:59.999Z'),
  ETag: '"source-etag"',
}
const config = {
  bucket: 'bucket',
  scope: 'bucket:*',
  cutoff,
  deleting: true,
}

const stale = [
  immutable,
  { ...immutable, Key: '123/profile.webp' },
  { ...immutable, Key: 'unknown.webp' },
  { ...immutable, Key: 'https://images.example.com/legacy.webp' },
]
assert.deepEqual(selectCandidates(stale, new Set(), cutoff), [immutable])
assert.deepEqual(
  selectManualReview(stale, new Set(), cutoff).map(({ key }) => key),
  stale.slice(1).map(({ Key }) => Key),
)
assert.equal(
  selectCandidates([{ ...immutable, ETag: undefined }], new Set(), cutoff)
    .length,
  0,
)
assert.equal(
  selectCandidates([{ ...immutable, LastModified: cutoff }], new Set(), cutoff)
    .length,
  0,
)

assert.equal(
  keyFromPublicUrl(
    'https://images.example.com//uploads//legacy.webp',
    'https://images.example.com/uploads/',
  ),
  'legacy.webp',
)
assert.equal(
  keyFromPublicUrl(
    'https://other.example.com/uploads/legacy.webp',
    'https://images.example.com/uploads',
  ),
  null,
)

const databaseCalls = []
await readReferences(
  {
    query: async (query) => {
      databaseCalls.push(query)
      if (typeof query === 'object') {
        assert.match(query.text, /"imageKey"/)
        assert.match(query.text, /FROM images/)
        assert.match(query.text, /legacy_image/)
        return {
          rows: [
            { key: 'category-key', legacy_image: null },
            { key: 'image-key', legacy_image: null },
            {
              key: null,
              legacy_image: 'https://images.example.com//uploads//legacy.webp',
            },
            { key: null, legacy_image: 'https://outside.example/legacy.webp' },
          ],
        }
      }
      return { rows: [] }
    },
  },
  'https://images.example.com/uploads/',
  { deadlineAt: Date.now() + 1_000, dbTimeoutMillis: 1_000 },
)
assert.equal(
  databaseCalls.filter((query) => typeof query === 'object').length,
  1,
)
assert.equal(databaseCalls.length, 1)
assert.throws(() => remainingDeadlineMillis(1_000, 1_000), /deadline exceeded/)

const dedicatedClientCalls = []
await readReferences(
  {
    connect: async () => {
      throw new Error('must not reconnect a dedicated lock client')
    },
    release: () => {},
    query: async (query) => {
      dedicatedClientCalls.push(query)
      return typeof query === 'object' ? { rows: [] } : { rows: [] }
    },
  },
  'https://images.example.com/uploads/',
  { deadlineAt: Date.now() + 1_000, dbTimeoutMillis: 1_000 },
)
assert.equal(dedicatedClientCalls.length, 1)

const manifest = candidateManifest(config, [immutable])
assert.equal(manifest.entries[0].etag, immutable.ETag)
assert.equal(
  manifest.entries[0].lastModified,
  immutable.LastModified.toISOString(),
)
assert.equal(
  manifest.manifestKey,
  `_r2-orphan-manifests/${manifest.runId}.json`,
)
assert.equal(
  manifest.quarantinePrefix,
  `_r2-orphan-quarantine/${manifest.runId}/`,
)
assert.notEqual(
  candidateManifest(config, [immutable], [{ key: 'manual' }]).digest,
  manifest.digest,
)

const pages = [
  { Contents: [immutable], IsTruncated: true, NextContinuationToken: 'next' },
  { Contents: [{ ...immutable, Key: 'second' }], IsTruncated: false },
]
assert.deepEqual(
  (await listObjects({ send: async () => pages.shift() }, 'bucket', '')).map(
    ({ Key }) => Key,
  ),
  [immutable.Key, 'second'],
)
await assert.rejects(
  () =>
    listObjects(
      {
        send: async () => ({
          Contents: [],
          IsTruncated: true,
          NextContinuationToken: 'same',
        }),
      },
      'bucket',
      '',
    ),
  /pagination did not advance/,
)

const commands = []
const sourceHeads = [immutable, immutable]
const target = await quarantineObject(
  {
    send: async (command) => {
      commands.push(command)
      if (command instanceof HeadObjectCommand) return sourceHeads.shift()
      return {}
    },
  },
  { ...config, quarantinePrefix: manifest.quarantinePrefix },
  immutable,
)
assert.equal(target, `${manifest.quarantinePrefix}${immutable.Key}`)
assert.ok(commands[0] instanceof HeadObjectCommand)
assert.ok(commands[1] instanceof CopyObjectCommand)
assert.equal(commands[1].input.CopySourceIfMatch, immutable.ETag)
assert.ok(commands[2] instanceof HeadObjectCommand)
assert.ok(commands[3] instanceof DeleteObjectCommand)
assert.equal(
  await quarantineObject(
    { send: async () => ({ ...immutable, ETag: '"changed"' }) },
    { ...config, quarantinePrefix: manifest.quarantinePrefix },
    immutable,
  ),
  null,
)

let mutationCalls = 0
await assert.rejects(
  () =>
    executeCleanup({
      config,
      client: {
        send: async (command) => {
          if (command instanceof PutObjectCommand)
            throw new Error('manifest failed')
          mutationCalls += 1
          return immutable
        },
      },
      getReferences: async () => new Set(),
      list: async () => [immutable],
      log: () => {},
    }),
  /manifest failed/,
)
assert.equal(mutationCalls, 0)

const runs = []
for (let attempt = 0; attempt < 2; attempt += 1) {
  const calls = []
  const logs = []
  await executeCleanup({
    config,
    client: {
      send: async (command) => {
        calls.push(command)
        if (command instanceof HeadObjectCommand) return immutable
        return {}
      },
    },
    getReferences: async () => new Set(),
    list: async () => [immutable],
    log: (line) => logs.push(JSON.parse(line)),
  })
  const persisted = calls[0]
  assert.ok(persisted instanceof PutObjectCommand)
  assert.equal(persisted.input.Key, manifest.manifestKey)
  assert.equal(persisted.input.Body, JSON.stringify(manifest))
  const quarantined = logs.find(
    ({ event }) => event === 'r2_orphan_quarantined',
  )
  runs.push(quarantined.quarantineKey)
}
assert.deepEqual(runs, [runs[0], runs[0]])

let referenceReads = 0
await executeCleanup({
  config,
  client: { send: async () => ({}) },
  getReferences: async () => {
    referenceReads += 1
    return referenceReads === 1 ? new Set() : new Set([immutable.Key])
  },
  list: async () => [immutable],
  log: () => {},
})
assert.equal(referenceReads, 2)

const advisoryLock = { held: false, keys: [], releases: [] }
function fakeLockClient(name) {
  let ownsLock = false
  return {
    query: async ({ text, values }) => {
      assert.equal(text, 'SELECT pg_try_advisory_lock($1::bigint) AS acquired')
      advisoryLock.keys.push(values[0])
      if (advisoryLock.held) return { rows: [{ acquired: false }] }
      advisoryLock.held = true
      ownsLock = true
      return { rows: [{ acquired: true }] }
    },
    release: (destroy) => {
      advisoryLock.releases.push({ name, destroy })
      if (ownsLock) advisoryLock.held = false
    },
  }
}
const firstLockClient = fakeLockClient('first')
const secondLockClient = fakeLockClient('second')
const advisoryPool = {
  connect: async () =>
    advisoryLock.keys.length === 0 ? firstLockClient : secondLockClient,
}
const firstLock = await acquireCleanupLock(
  advisoryPool,
  Date.now() + 1_000,
  1_000,
)
await assert.rejects(
  () => acquireCleanupLock(advisoryPool, Date.now() + 1_000, 1_000),
  /another cleanup is running/,
)
assert.deepEqual(advisoryLock.keys, [
  R2_CLEANUP_ADVISORY_LOCK_KEY,
  R2_CLEANUP_ADVISORY_LOCK_KEY,
])
assert.deepEqual(advisoryLock.releases, [{ name: 'second', destroy: true }])
firstLock.release(true)

for (const outcome of ['success', 'error', 'deadline']) {
  const client = fakeLockClient(outcome)
  const pool = { connect: async () => client }
  if (outcome === 'success') {
    await withCleanupLock(
      pool,
      { deadlineAt: Date.now() + 1_000, dbTimeoutMillis: 1_000 },
      async () => {},
    )
  } else if (outcome === 'error') {
    await assert.rejects(
      () =>
        withCleanupLock(
          pool,
          { deadlineAt: Date.now() + 1_000, dbTimeoutMillis: 1_000 },
          async () => {
            throw new Error('work failed')
          },
        ),
      /work failed/,
    )
  } else {
    await assert.rejects(
      () =>
        withCleanupLock(
          pool,
          { deadlineAt: Date.now() + 1_000, dbTimeoutMillis: 1_000 },
          () => withinDeadline(new Promise(() => {}), Date.now() + 1),
        ),
      /deadline exceeded/,
    )
  }
}
assert.deepEqual(
  advisoryLock.releases.slice(-3),
  ['success', 'error', 'deadline'].map((name) => ({ name, destroy: true })),
)

let destructiveWorkStarted = false
const unavailablePool = {
  connect: async () => ({
    query: async () => ({ rows: [{ acquired: false }] }),
    release: () => {},
  }),
}
await assert.rejects(
  () =>
    withCleanupLock(
      unavailablePool,
      { deadlineAt: Date.now() + 1_000, dbTimeoutMillis: 1_000 },
      async () => {
        destructiveWorkStarted = true
      },
    ),
  /another cleanup is running/,
)
assert.equal(destructiveWorkStarted, false)

await assert.rejects(
  () =>
    cleanupResources(
      {
        end: async () => {
          throw new Error('pool shutdown failed')
        },
      },
      100,
    ),
  /resource shutdown failed/,
)

assert.throws(
  () =>
    cleanupConfig(['--delete'], {
      R2_BUCKET_NAME: 'bucket',
      R2_PUBLIC_URL: 'https://images.example.com/',
      R2_CLEANUP_CONFIRM_SCOPE: 'bucket:other',
    }),
  /bucket:\*/,
)

const packageJson = await readFile(
  new URL('../package.json', import.meta.url),
  'utf8',
)
const workflow = await readFile(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
)
assert.match(packageJson, /"check:critical"[\s\S]*check:r2-cleanup/)
assert.match(packageJson, /"check:critical"[\s\S]*check:uploads/)
assert.match(workflow, /pnpm check:critical/)
assert.match(workflow, /pnpm check:docker/)
