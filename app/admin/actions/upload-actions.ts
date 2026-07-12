'use server'

import { cookies } from 'next/headers'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { verifySession } from '@/lib/auth'
import { validateImageUploadSize } from '@/lib/image-upload-validation'
import { ImageProcessingError, processImage } from '@/lib/image-processing'
import { createUploadKey } from '@/lib/catalog-safeguards'
import { logActionOutcome } from '@/lib/action-logging'

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  const isValid = await verifySession(session?.value)
  if (!isValid) {
    throw new Error('No autorizado')
  }
}

export async function uploadImageAction(
  formData: FormData,
): Promise<
  | { success: true; url: string; key: string; error?: never }
  | { success?: false; error: string }
> {
  const fail = (
    error: string,
    failureClass: string,
    cause?: unknown,
    diagnostics: Record<string, unknown> = {},
  ): { error: string } => {
    logActionOutcome(
      'upload-image',
      'failure',
      failureClass,
      cause,
      diagnostics,
    )
    return { error }
  }
  try {
    await checkAuth()
  } catch {
    return fail('No autorizado', 'unauthorized')
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return fail('No se proporcionó ningún archivo', 'validation')
  }

  const validationError = validateImageUploadSize(file)
  if (validationError) return fail(validationError, 'validation')

  const uploadDiagnostics = {
    original_bytes: file.size,
    browser_mime: file.type || 'unknown',
  }
  let optimizedBuffer: Buffer
  let imageDiagnostics: Record<string, unknown> = {}

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const processed = await processImage(buffer)
    optimizedBuffer = processed.optimizedBuffer
    imageDiagnostics = processed.diagnostics
  } catch (error) {
    const processingError =
      error instanceof ImageProcessingError ? error : undefined
    return fail(
      'No se pudo procesar la imagen. Verifica que sea un archivo JPEG o PNG válido.',
      'image_processing',
      processingError?.cause ?? error,
      { ...uploadDiagnostics, ...processingError?.diagnostics },
    )
  }

  const key = createUploadKey()
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
      }),
    )
  } catch (error) {
    return fail(
      'La imagen se procesó, pero no se pudo subir. Inténtalo de nuevo.',
      'r2',
      error,
      { ...uploadDiagnostics, ...imageDiagnostics },
    )
  }

  const url = `${R2_PUBLIC_URL}/${key}`
  logActionOutcome('upload-image', 'success')
  return { success: true, url, key }
}
