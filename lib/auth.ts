// Primitivas de autenticación utilizando Web Crypto API (subtle)
// Seguro para correr tanto en Node.js como en Vercel Edge Runtime.

const SESSION_COOKIE = 'admin-session'

// Helpers para codificación/decodificación Base64URL sin depender del módulo Buffer de Node
function base64urlEncode(uint8: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Obtener la clave criptográfica HMAC a partir del SESSION_SECRET
async function getCryptoKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('La variable de entorno SESSION_SECRET no está definida.')
  }
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/**
 * Crea una cadena firmada con HMAC para la sesión del administrador
 * @param expMs Tiempo de expiración de la sesión en milisegundos
 */
export async function createSession(expMs: number): Promise<string> {
  const key = await getCryptoKey()
  const encoder = new TextEncoder()

  const payload = JSON.stringify({ exp: expMs })
  const payloadBase64 = base64urlEncode(encoder.encode(payload))

  const dataToSign = encoder.encode(payloadBase64)
  const signature = await crypto.subtle.sign('HMAC', key, dataToSign)
  const signatureBase64 = base64urlEncode(new Uint8Array(signature))

  return `${payloadBase64}.${signatureBase64}`
}

/**
 * Verifica si el valor de la cookie de sesión es válido y no ha expirado
 * @param sessionCookie Valor crudo de la cookie 'admin-session'
 */
export async function verifySession(sessionCookie?: string): Promise<boolean> {
  if (!sessionCookie) return false

  const parts = sessionCookie.split('.')
  if (parts.length !== 2) return false

  try {
    const [payloadBase64, signatureBase64] = parts
    const key = await getCryptoKey()
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // 1. Verificar firma HMAC
    const dataToVerify = encoder.encode(payloadBase64)
    const signatureBytes = base64urlDecode(signatureBase64)
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      dataToVerify,
    )
    if (!isValid) return false

    // 2. Verificar fecha de expiración
    const payloadBytes = base64urlDecode(payloadBase64)
    const payload = JSON.parse(decoder.decode(payloadBytes))
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error verificando sesión:', error)
    return false
  }
}
