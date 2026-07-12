export type UploadedImage = {
  id?: string
  url: string
  key: string
  alt?: string
}

export function parseUploadedImages(
  value: FormDataEntryValue | null,
): { images: UploadedImage[] } | { error: string } {
  if (typeof value !== 'string') return { error: 'Datos de imágenes inválidos' }

  try {
    const parsed: unknown = JSON.parse(value)
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (image) =>
          typeof image === 'object' &&
          image !== null &&
          typeof image.url === 'string' &&
          image.url.length > 0 &&
          typeof image.key === 'string' &&
          image.key.length > 0 &&
          (image.alt === undefined || typeof image.alt === 'string'),
      )
    ) {
      return { error: 'Datos de imágenes inválidos' }
    }

    return { images: parsed as UploadedImage[] }
  } catch {
    return { error: 'Datos de imágenes inválidos' }
  }
}

export function resolveCategoryImage(
  imageProvided: boolean,
  imageKeyProvided: boolean,
  image: string | null,
  imageKey: string | null,
  current: { image: string | null; imageKey: string | null },
) {
  if (!imageProvided && !imageKeyProvided) return current
  if (!image || !imageKey) return { image: null, imageKey: null }
  return { image, imageKey }
}

export function isStaleWrite(expectedUpdatedAt: Date, currentUpdatedAt: Date) {
  return expectedUpdatedAt.getTime() !== currentUpdatedAt.getTime()
}

export function canFeatureCostume(featuredCount: number) {
  return featuredCount < 10
}

export function orderedImages(images: UploadedImage[]) {
  return images.map((image, order) => ({ ...image, order }))
}

export function costumeRevalidationPaths(oldSlug: string, newSlug: string) {
  return [...new Set([`/costumes/${newSlug}`, `/costumes/${oldSlug}`])]
}

export function createUploadKey() {
  return `uploads/${crypto.randomUUID()}.webp`
}

export function isCurrentUploadKey(key: string) {
  return /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/.test(
    key,
  )
}

export function escapeJsonForScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
