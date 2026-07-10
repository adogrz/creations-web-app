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
logic check is infrastructure-free (`pnpm check:catalog`); database integration
requires a PostgreSQL service and is covered by the deployment verification.
