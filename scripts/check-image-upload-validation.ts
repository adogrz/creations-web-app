import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_HELP_TEXT,
  IMAGE_UPLOAD_INGRESS_ERROR,
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageFile,
} from '../lib/image-upload-validation'
import { ImageProcessingError, processImage } from '../lib/image-processing'

assert.equal(
  validateImageFile({
    name: 'image.png',
    type: 'image/png',
    size: MAX_IMAGE_UPLOAD_BYTES,
  }),
  null,
)
assert.equal(
  validateImageFile({
    name: 'image.jpg',
    type: 'image/jpeg',
    size: MAX_IMAGE_UPLOAD_BYTES,
  }),
  null,
)
assert.equal(validateImageFile({ name: 'image.jpeg', type: '', size: 1 }), null)
assert.equal(
  validateImageFile({
    name: 'image.PNG',
    type: 'application/octet-stream',
    size: 1,
  }),
  null,
)
assert.equal(
  validateImageFile({
    name: 'image.jpeg',
    type: 'image/jpeg',
    size: MAX_IMAGE_UPLOAD_BYTES + 1,
  }),
  'La imagen no puede superar los 9 MB',
)
assert.equal(
  validateImageFile({ name: 'image.webp', type: 'image/webp', size: 1 }),
  'Solo se permiten imágenes PNG o JPEG',
)
assert.equal(
  validateImageFile({ name: 'image.gif', type: '', size: 1 }),
  'Solo se permiten imágenes PNG o JPEG',
)
assert.equal(IMAGE_UPLOAD_ACCEPT, 'image/png,image/jpeg,.png,.jpg,.jpeg')
assert.equal(IMAGE_UPLOAD_HELP_TEXT, 'PNG, JPG o JPEG, máximo 9 MB')
assert.match(IMAGE_UPLOAD_INGRESS_ERROR, /antes de procesar.*9 MB.*proxy/i)

async function checkProcessing() {
  for (const format of ['png', 'jpeg'] as const) {
    const input = await sharp({
      create: { width: 2, height: 2, channels: 4, background: '#336699cc' },
    })
      [format]()
      .toBuffer()
    const processed = await processImage(input)
    assert.equal(processed.diagnostics.format, format)
    assert.equal(
      (await sharp(processed.optimizedBuffer).metadata()).format,
      'webp',
    )
  }

  const unsupported = await sharp({
    create: { width: 1, height: 1, channels: 3, background: '#000000' },
  })
    .webp()
    .toBuffer()
  await assert.rejects(processImage(unsupported), ImageProcessingError)
}

void checkProcessing().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

const uploadAction = readFileSync(
  new URL('../app/admin/actions/upload-actions.ts', import.meta.url),
  'utf8',
)
assert.match(uploadAction, /'image_processing'/)
assert.match(uploadAction, /'r2'/)
assert.match(uploadAction, /La imagen se procesó, pero no se pudo subir/)
assert.doesNotMatch(uploadAction, /procesar o subir la imagen/)

const uploadClient = readFileSync(
  new URL('../lib/upload-image-client.ts', import.meta.url),
  'utf8',
)
assert.match(uploadClient, /catch \{[\s\S]*IMAGE_UPLOAD_INGRESS_ERROR/)

for (const action of [
  'costume-actions.ts',
  'category-actions.ts',
  'settings-actions.ts',
]) {
  const source = readFileSync(
    new URL(`../app/admin/actions/${action}`, import.meta.url),
    'utf8',
  )
  assert.match(
    source,
    /revalidatePath\('\/\(site\)\/costumes\/\[slug\]', 'page'\)/,
  )
  assert.doesNotMatch(source, /revalidatePath\('\/costumes\/\[slug\]'/)
}

const costumeAction = readFileSync(
  new URL('../app/admin/actions/costume-actions.ts', import.meta.url),
  'utf8',
)
assert.match(costumeAction, /costumeRevalidationPaths\(oldSlug, slug\)/)
