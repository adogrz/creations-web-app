import assert from 'node:assert/strict'
import {
  MAX_IMAGE_UPLOAD_BYTES,
  validateImageFile,
} from '../lib/image-upload-validation'

assert.equal(
  validateImageFile({ type: 'image/png', size: MAX_IMAGE_UPLOAD_BYTES }),
  null,
)
assert.equal(
  validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_UPLOAD_BYTES }),
  null,
)
assert.equal(
  validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_UPLOAD_BYTES + 1 }),
  'La imagen no puede superar los 9 MB',
)
assert.equal(
  validateImageFile({ type: 'application/pdf', size: 1 }),
  'El archivo debe ser una imagen',
)
