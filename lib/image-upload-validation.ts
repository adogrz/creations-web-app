export const MAX_IMAGE_UPLOAD_BYTES = 9 * 1024 * 1024

export function validateImageFile(file: Pick<File, 'size' | 'type'>) {
  if (!file.type.startsWith('image/')) {
    return 'El archivo debe ser una imagen'
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return 'La imagen no puede superar los 9 MB'
  }

  return null
}
