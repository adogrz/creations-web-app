'use server'

import { cookies } from 'next/headers'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { verifySession } from '@/lib/auth'
import { validateImageFile } from '@/lib/image-upload-validation'
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
  ): { error: string } => {
    logActionOutcome('upload-image', 'failure', failureClass, cause)
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

  const validationError = validateImageFile(file)
  if (validationError) return fail(validationError, 'validation')

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Optimizar imagen con sharp:
    // - Redimensionar ancho máximo 1920px (sin agrandar si es menor)
    // - Convertir a formato WebP con calidad 80
    // - Limpiar metadatos EXIF implícitamente al procesar
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 1920,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: 80 })
      .toBuffer()

    const key = createUploadKey()

    // Subir el buffer directo a R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
      }),
    )

    // Construir la URL pública final
    const url = `${R2_PUBLIC_URL}/${key}`

    logActionOutcome('upload-image', 'success')
    return { success: true, url, key }
  } catch (error) {
    return fail('Error al procesar o subir la imagen', 'r2', error)
  }
}
