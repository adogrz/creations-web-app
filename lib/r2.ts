import { S3Client } from '@aws-sdk/client-s3'

let rawAccountId =
  process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || ''
// Limpiar si el usuario metió la URL completa del endpoint en lugar de solo el ID hexadecimal
const accountId = rawAccountId
  .replace(/^https?:\/\//, '') // Quitar http:// o https://
  .split('.')[0] // Quedarse con el primer segmento (ej. el ID)

const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

// Verificar la existencia de las variables requeridas en runtime
if (!accountId || !accessKeyId || !secretAccessKey || !R2_BUCKET_NAME) {
  console.warn(
    'ADVERTENCIA: Faltan variables de entorno de Cloudflare R2. Las cargas de imágenes fallarán.',
  )
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})
