'use server'

import { cookies } from 'next/headers'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'
import { verifySession } from '@/lib/auth'

async function checkAuth() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin-session')
  const isValid = await verifySession(session?.value)
  if (!isValid) {
    throw new Error('No autorizado')
  }
}

export async function uploadImageAction(formData: FormData) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return { error: 'No se proporcionó ningún archivo' }
  }

  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    return { error: 'El archivo debe ser una imagen' }
  }

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

    // Generar un key único en una subcarpeta
    const uniqueId = crypto.randomUUID()
    const key = `uploads/${uniqueId}.webp`

    // Subir el buffer directo a R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
      })
    )

    // Construir la URL pública final
    const url = `${R2_PUBLIC_URL}/${key}`

    return { success: true, url, key }
  } catch (error) {
    console.error('Error en uploadImageAction:', error)
    return { error: 'Error al procesar o subir la imagen' }
  }
}

export async function deleteImageAction(key: string) {
  try {
    await checkAuth()
  } catch {
    return { error: 'No autorizado' }
  }

  if (!key) {
    return { error: 'No se proporcionó la clave del archivo' }
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error en deleteImageAction:', error)
    return { error: 'Error al eliminar la imagen de R2' }
  }
}
