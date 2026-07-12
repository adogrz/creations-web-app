export const MAX_IMAGE_UPLOAD_BYTES = 9 * 1024 * 1024
export const IMAGE_UPLOAD_ACCEPT = 'image/png,image/jpeg,.png,.jpg,.jpeg'
export const IMAGE_UPLOAD_HELP_TEXT = 'PNG, JPG o JPEG, máximo 9 MB'
export const IMAGE_UPLOAD_INGRESS_ERROR =
  'La solicitud fue rechazada antes de procesar la imagen. Verifica el límite de 9 MB o la configuración del proxy.'

export function validateImageUploadSize(file: Pick<File, 'size'>) {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return 'La imagen no puede superar los 9 MB'
  }

  return null
}

export function validateImageFile(file: Pick<File, 'name' | 'size' | 'type'>) {
  const sizeError = validateImageUploadSize(file)
  if (sizeError) return sizeError

  const type = file.type.toLowerCase()
  if (type === 'image/png' || type === 'image/jpeg') return null

  if (
    (!type || type === 'application/octet-stream') &&
    /\.(?:png|jpe?g)$/i.test(file.name)
  ) {
    return null
  }

  return 'Solo se permiten imágenes PNG o JPEG'
}
