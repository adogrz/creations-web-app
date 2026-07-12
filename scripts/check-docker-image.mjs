import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const image = process.env.DOCKER_IMAGE ?? 'creations-web-app:smoke'
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8' })

run('docker', ['build', '--tag', image, '.'])

const config = JSON.parse(
  run('docker', ['image', 'inspect', image, '--format', '{{json .Config}}']),
)
assert.equal(config.User, 'node')
assert.ok(config.Healthcheck?.Test?.join(' ').includes('127.0.0.1:3000'))
assert.ok(config.Cmd?.join(' ').includes('prisma migrate deploy'))
assert.ok(config.Cmd?.join(' ').includes('node server.js'))

run('docker', [
  'run',
  '--rm',
  '--entrypoint',
  'sh',
  image,
  '-c',
  'test "$(id -u)" -ne 0 && test -x ./node_modules/.bin/prisma && test -f ./prisma/schema.prisma && test -f ./server.js && test -f ./scripts/r2-orphan-cleanup.mjs && node ./scripts/r2-orphan-cleanup.mjs --help | grep -q quarantines',
])
