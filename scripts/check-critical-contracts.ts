import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  canFeatureCostume,
  costumeRevalidationPaths,
  createUploadKey,
  escapeJsonForScript,
  isStaleWrite,
  orderedImages,
  parseUploadedImages,
  resolveCategoryImage,
} from '../lib/catalog-safeguards'

const parsed = parseUploadedImages(
  JSON.stringify([
    { url: 'https://cdn.example/image.webp', key: 'uploads/image.webp' },
  ]),
)
assert.deepEqual(parsed, {
  images: [
    { url: 'https://cdn.example/image.webp', key: 'uploads/image.webp' },
  ],
})
assert.deepEqual(parseUploadedImages('{'), {
  error: 'Datos de imágenes inválidos',
})

assert.deepEqual(
  resolveCategoryImage(true, true, '', '', {
    image: 'current-url',
    imageKey: 'current-key',
  }),
  { image: null, imageKey: null },
)

assert.equal(isStaleWrite(new Date('2026-01-01'), new Date('2026-01-02')), true)
assert.equal(
  isStaleWrite(new Date('2026-01-01'), new Date('2026-01-01')),
  false,
)
assert.equal(canFeatureCostume(9), true)
assert.equal(canFeatureCostume(10), false)

assert.deepEqual(
  orderedImages([
    { url: 'b', key: 'b' },
    { url: 'a', key: 'a' },
  ]),
  [
    { url: 'b', key: 'b', order: 0 },
    { url: 'a', key: 'a', order: 1 },
  ],
)
assert.deepEqual(costumeRevalidationPaths('old-slug', 'new-slug'), [
  '/costumes/new-slug',
  '/costumes/old-slug',
])

const firstKey = createUploadKey()
const secondKey = createUploadKey()
assert.match(firstKey, /^uploads\/[0-9a-f-]{36}\.webp$/)
assert.match(secondKey, /^uploads\/[0-9a-f-]{36}\.webp$/)
assert.notEqual(firstKey, secondKey)

assert.equal(
  escapeJsonForScript({ name: '</script><script>alert(1)</script>' }).includes(
    '<',
  ),
  false,
)

const nextConfig = readFileSync(
  new URL('../next.config.mjs', import.meta.url),
  'utf8',
)
assert.match(nextConfig, /bodySizeLimit: '10mb'/)
assert.match(nextConfig, /allowedOrigins: \['creations\.adogrz\.com'\]/)
