import sharp, { type Metadata } from 'sharp'

export type ImageDiagnostics = Partial<
  Pick<Metadata, 'format' | 'width' | 'height' | 'hasAlpha'>
>

export class ImageProcessingError extends Error {
  constructor(
    cause: unknown,
    readonly diagnostics: ImageDiagnostics,
  ) {
    super('Image processing failed', { cause })
    this.name = 'ImageProcessingError'
  }
}

export async function processImage(buffer: Buffer) {
  let diagnostics: ImageDiagnostics = {}

  try {
    const image = sharp(buffer)
    const { format, width, height, hasAlpha } = await image.metadata()
    diagnostics = { format, width, height, hasAlpha }

    if (format !== 'jpeg' && format !== 'png') {
      throw new Error('Unsupported image format')
    }

    const optimizedBuffer = await image
      .resize({ width: 1920, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer()

    return { optimizedBuffer, diagnostics }
  } catch (error) {
    throw new ImageProcessingError(error, diagnostics)
  }
}
