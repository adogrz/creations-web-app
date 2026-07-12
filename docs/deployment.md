# Deployment

## Dokploy Dockerfile

Configure the application to build with this repository's `Dockerfile` and
target port `3000`. Do not publish the container port directly; use the
Dokploy-managed Traefik domain instead.

Set these **build arguments** in Dokploy. Next.js freezes `NEXT_PUBLIC_*`
values at build time, so runtime variables alone do not update browser code.

```text
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_UMAMI_WEBSITE_ID
NEXT_PUBLIC_UMAMI_URL
NEXT_PUBLIC_UMAMI_DOMAINS
```

Set `DATABASE_URL` as a runtime secret. The startup command runs
`prisma migrate deploy` from `prisma.config.ts` before `node server.js`; do
not deploy multiple application replicas that can migrate concurrently.

## R2 orphan cleanup Schedule Job

Replacing or deleting a category or costume removes its database reference but
intentionally retains the old R2 object. Image keys are not uniquely owned in
the database, so synchronous deletion could remove a live object during
concurrent updates. Use the offline cleanup command instead.

The command defaults to dry-run and lists all non-quarantine R2 objects (or the
optional `R2_CLEANUP_PREFIX`) through pagination. It treats stored
`Category.imageKey` and `Image.key` as authoritative, and also recognizes a
legacy `Category.image` only when its URL is under the exact configured
`R2_PUBLIC_URL` origin and path. It protects objects newer than
`R2_CLEANUP_GRACE_DAYS` (default `7`).

`--delete` **does not hard-delete objects**. It only quarantines immutable
server-owned keys exactly matching `uploads/<uuid>.webp`. A legacy key such as
`<id>/profile.webp`, an unknown key, or a URL-shaped legacy object is reported
in `manualReview` and is never copied or deleted automatically. For every safe
candidate, the command heads the source, verifies its listed ETag and age,
conditionally copies it to `_r2-orphan-quarantine/<runId>/<original-key>` with
`CopySourceIfMatch`, heads it again, and deletes only if its identity is still
unchanged. Quarantine and manifest objects are never scanned as candidates.
Storage is not reclaimed by this command; the Cloudflare lifecycle rule below
reclaims only quarantined storage after retention.

Every run emits a deterministic JSON candidate manifest with the exact keys,
sizes, ETags, modification timestamps, SHA-256 digest, digest-derived `runId`,
and `quarantinePrefix`. Before any mutation, a destructive run persists that
exact manifest at `_r2-orphan-manifests/<runId>.json`; persistence failure stops
the run before copying or deleting. A destructive run uses exactly
`_r2-orphan-quarantine/<runId>/` and logs each `sourceKey` and `quarantineKey`,
so the restore source is unambiguous. Retrying the same unchanged candidate set
uses the same target path and manifest. List `_r2-orphan-manifests/` and the
logged quarantine prefix to reconcile a partial retry. A destructive run scans
once, then re-reads all database references in one PostgreSQL statement snapshot
before **each candidate** and skips a key that became referenced. It never
recomputes or expands the manifest.

R2's S3-compatible `DeleteObject` operation has no conditional ETag input. The
second head narrows that unavoidable delete race; the immutable UUID key
invariant is what makes deletion safe: application uploads never replace an
existing `uploads/<uuid>.webp` object.

Set these runtime variables in Dokploy:

```text
R2_CLEANUP_GRACE_DAYS=7
R2_CLEANUP_PREFIX=
R2_CLEANUP_CONFIRM_SCOPE= # exact: <R2_BUCKET_NAME>:<R2_CLEANUP_PREFIX-or-*>
R2_CLEANUP_DEADLINE_MINUTES=20
R2_CLEANUP_DB_TIMEOUT_MS=10000
```

To scope a shared bucket, set `R2_CLEANUP_PREFIX` (for example, `uploads/`).
An empty prefix means `*` (the full bucket except the reserved quarantine
prefix). A prefix beginning with `_r2-orphan-quarantine/` is rejected. Run the
deployed-container dry-run first:

```text
node scripts/r2-orphan-cleanup.mjs
```

For an intentional quarantine run only, set
`R2_CLEANUP_CONFIRM_SCOPE` to the exact bucket-and-scope value. For example,
with bucket `creations-images` and prefix `uploads/`:

```text
R2_CLEANUP_CONFIRM_SCOPE=creations-images:uploads/
```

Then run:

```text
node scripts/r2-orphan-cleanup.mjs --delete
```

For a full-bucket scan, the only accepted value is
`R2_CLEANUP_CONFIRM_SCOPE=creations-images:*`. Without that exact confirmation,
`--delete` fails closed. The confirmation binds both bucket and scan scope;
never put it in a routine dry-run job.

Configure a Cloudflare R2 lifecycle rule in the bucket once: **Delete objects**
whose prefix is exactly `_r2-orphan-quarantine/` after **30 days**. Thirty days
is the default recovery retention; change the lifecycle rule to another positive
retention only after updating this runbook. Do not use a broad lifecycle rule:
it must be restricted to that prefix. Lifecycle processing is asynchronous, so
the cleanup summary must not be read as immediately reclaimed storage.

To restore before expiry, take `quarantinePrefix` from the persisted manifest
or summary and first check the original destination key (the suffix after
`<runId>/`). **If it exists, STOP: do not overwrite it.** Compare the existing
destination and quarantined object manually before choosing a recovery action.
Only when `head-object` reports absence may an administrator copy the
quarantined source back:

```bash
aws s3api head-object --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --bucket "$R2_BUCKET_NAME" --key "<original-key>"
```

If that command succeeds, STOP. If it fails for any reason other than a
confirmed `404 Not Found`, STOP and investigate. Only after confirming absence,
run the copy:

```bash
aws s3api copy-object \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --bucket "$R2_BUCKET_NAME" \
  --copy-source "$R2_BUCKET_NAME/_r2-orphan-quarantine/<runId>/<original-key>" \
  --key "<original-key>" \
  --metadata-directive COPY
aws s3api head-object --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --bucket "$R2_BUCKET_NAME" --key "<original-key>"
```

After the post-copy `head-object` verification, remove the quarantine copy only
if the lifecycle rule has not already removed it. Do not restore by moving a URL
or by creating a new database reference; the original object key is authoritative.

Before any cleanup work, the job checks the fixed application-specific
PostgreSQL session advisory-lock bigint `482912076143587201` on its dedicated
database connection. Do not change this key: every replica must contend for the
same lock. If another run holds it, the command fails nonzero with `another
cleanup is running`.
Because all replicas and containers contend through the same PostgreSQL
database, this is a global job lock rather than a container-local filesystem
lock. The connection is destroyed after every success, error, or deadline, so
PostgreSQL releases the session lock when it observes the closed connection;
crash or container termination is handled the same way. A network partition can
delay PostgreSQL's observation until it closes that session, so do not start a
second run until the first command has failed or exited.
`R2_CLEANUP_DEADLINE_MINUTES` bounds the whole run; PostgreSQL pool server
`statement_timeout` and client query timeout are capped by
`R2_CLEANUP_DB_TIMEOUT_MS`, and every R2 operation
receives the same abort signal. The advisory-lock connection is destroyed before
the bounded pool shutdown. Configure one scheduled job; concurrent replicas are
safe because they share this PostgreSQL lock.

In Dokploy, create a **Schedule Job** of type **Application Job**, select this
application's running container, set the dry-run command
`node scripts/r2-orphan-cleanup.mjs`, set cron to `0 3 * * 0` (weekly Sunday
03:00), save it, manually run it once, then inspect its execution log for the
manifest digest and zero errors. Application Jobs execute one command with
`docker exec`, so the target container must be running. The timezone follows the
Dokploy/server scheduler; verify it before relying on 03:00.

Use `node scripts/r2-orphan-cleanup.mjs --delete` only as a separately reviewed
Application Job/manual execution with the matching confirmation scope set for
that run. It quarantines only safe current UUID keys; `manualReview` keys remain
untouched. Inspect the persisted manifest, `skippedReferenced`, `quarantined`,
`manualReview`, and `errors` fields in Dokploy logs. A nonzero result means no
successful completion; investigate before retrying.

## Server action outcome monitoring

Category and costume create, update, and delete actions emit one minimal
`admin_action_outcome` JSON log for every success or failure. Each event has an
`action`, an `outcome`, and failures also have a bounded `failure_class`; events
never include form values, image URLs/keys, users, secrets, or stack traces.
If post-save revalidation fails, it emits a distinct `completion` failure before
the persisted success event.
In Dokploy, group counts by `action` and `outcome`.

For each action in a stated rolling 15-minute window, calculate
`failure events / all outcome events for that action`. Dokploy logs do not
enforce alerts or release actions; configure those thresholds in the deployed
monitoring system before treating them as an operational control.

## Umami script proxy

Set `NEXT_PUBLIC_UMAMI_URL=https://analytics.adogrz.com` in Dokploy as both a
build argument and runtime variable. It must be the Umami origin that serves
`/script.js`, without a path suffix. Before deploying, verify the upstream:

```bash
curl -fsSI https://analytics.adogrz.com/script.js
```

It must return `200`. If it returns `404`, correct the Umami domain/base-path
configuration before changing this application.

## Cloudflare Tunnel, Traefik, and Umami IP forwarding

`proxy.ts` forwards only `x-visitor-ip` to Umami and removes
`cf-connecting-ip`, `x-forwarded-for`, and `x-real-ip`. It deliberately does
not derive an address from client-controlled forwarding headers.

Before setting `CLIENT_IP_HEADER=x-visitor-ip` in Umami, the deployment owner
must make this header trustworthy:

1. Route the public hostname through a Cloudflare Tunnel to the Dokploy
   Traefik entrypoint. Cloudflare supplies `CF-Connecting-IP` on edge-to-origin
   HTTP traffic.
2. The application endpoint **MUST** be ingress-only: keep it reachable only
   from Dokploy's internal network through Traefik, with no host port mapping,
   no public container address, and firewall rules that prevent bypassing the
   Tunnel/Traefik path.
3. At an ingress component that only receives Tunnel traffic, remove any
   client-supplied `x-visitor-ip` and overwrite it from the trusted
   `CF-Connecting-IP` value before Traefik forwards to this app.

Traefik's built-in `headers.customRequestHeaders` writes literal values; it
cannot copy `CF-Connecting-IP` dynamically. Do not configure it with
`{CF-Connecting-IP}`. Use an ingress normalizer that supports dynamic header
mapping, or leave `x-visitor-ip` unset. The repository cannot prove the
network boundary or configure that normalizer.

For Umami, set:

```text
CLIENT_IP_HEADER=x-visitor-ip
```

`CLIENT_IP_HEADER` tells Umami which normalized request header contains the
visitor address. Leave `SKIP_LOCATION_HEADERS` unset to permit Umami's location
header lookup. Set `SKIP_LOCATION_HEADERS=1` to disable that lookup when header
location data is not trusted or location collection is intentionally disabled.

## Verification

After deployment, make a request from a known external network and inspect the
Umami event/session location. It must match the known public IP's approximate
location, not the Cloudflare, Tunnel, Traefik, or Docker address. Then send an
`X-Visitor-IP: 203.0.113.1` request through the public hostname and verify its
recorded address still matches the known network. If either check fails, unset
`CLIENT_IP_HEADER` and fix the ingress normalizer before enabling location
enrichment.

## Migration failure recovery

If startup fails at `prisma migrate deploy`, do not restart replicas or claim a
database rollback. Keep the failed release stopped, take a backup, and inspect
the migration state:

```bash
pnpm prisma migrate status
```

Identify the failed migration and the schema changes already applied. After
reviewing and fixing the database state, use `pnpm prisma migrate resolve
--rolled-back <migration_name>` only when the migration's effects were safely
undone; otherwise use `--applied` only after verifying its intended effects are
present. Ship a fix-forward migration, then run `pnpm prisma migrate deploy`
and `pnpm prisma migrate status` before starting the application. Prisma does
not provide a safe automatic production rollback.

## App failure after a successful migration

Keep the prior Dokploy image immutable and tagged before every deploy. If the
new application fails after `prisma migrate deploy` succeeds, stop the failed
release, retain logs, and redeploy that exact prior image only when the applied
migration is backward-compatible with the prior application. Do not assume a
container rollback also rolls back the database: additive/expand migrations can
usually support this fix-forward step, while destructive or contract-changing
migrations may require an emergency compatible application patch instead. Once
service is restored, ship a fix-forward migration/application release and
verify `pnpm prisma migrate status` before promoting it.

## Docker verification

Run the repository-only image smoke check without production secrets:

```bash
pnpm check:docker
```

It builds the image, verifies its non-root user, health check, migration/start
command, and required Prisma/server files without starting migrations. Real
database reachability remains an external deployment check; verify it against
an isolated database:

```bash
docker build -t creations-web-app:smoke .
docker run --rm --env-file .env -p 3000:3000 creations-web-app:smoke
```

Confirm `/` and `/costumes` respond after migration completes. The catalog
logic check is infrastructure-free (`pnpm check:catalog`). The database
integration check uses unique fixture records and cleans them in a `finally`
block; it fails closed unless both `NODE_ENV=test` and
`INTEGRATION_TEST_DATABASE=1` are set:

```bash
pnpm check:integration
```

CI runs it after migrations and Prisma generation, before the build.

The CI critical-contract gate is also runnable locally:

```bash
pnpm check:critical
```

It runs the assert-based catalog/upload decisions, proxy safety, and R2 cleanup
contract checks without a database or new test dependency.
