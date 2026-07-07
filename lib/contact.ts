export function getWhatsappLink(
  whatsappNumber: string,
  costumeUrl?: string,
): string {
  const text = costumeUrl
    ? `¡Hola Creations! Me encantaría saber más sobre este disfraz: ${costumeUrl}`
    : `¡Hola Creations! Me encantaría conocer más sobre sus disfraces personalizados.`
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
}

export function getMessengerLink(
  messengerHandle: string,
  costumeUrl?: string,
): string {
  const base = `https://www.facebook.com/messages/t/${messengerHandle}`
  if (costumeUrl) {
    const text = `¡Hola Creations! Me encantaría saber más sobre este disfraz: ${costumeUrl}`
    return `${base}?text=${encodeURIComponent(text)}`
  }
  return base
}

export function getInstagramLink(
  instagramHandle: string | null,
  costumeUrl?: string,
): string | null {
  if (!instagramHandle) return null
  const base = `https://ig.me/m/${instagramHandle}`
  if (costumeUrl) {
    const text = `¡Hola Creations! Me encantaría saber más sobre este disfraz: ${costumeUrl}`
    return `${base}?text=${encodeURIComponent(text)}`
  }
  return base
}
