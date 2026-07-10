const FORWARDING_HEADERS = [
  'cf-connecting-ip',
  'x-forwarded-for',
  'x-real-ip',
  'x-visitor-ip',
]

export function getUmamiRequestHeaders(headers: Headers) {
  const visitorIp = headers.get('x-visitor-ip')
  const requestHeaders = new Headers(headers)

  for (const header of FORWARDING_HEADERS) requestHeaders.delete(header)
  if (visitorIp) requestHeaders.set('x-visitor-ip', visitorIp)

  return requestHeaders
}

export function getUmamiRewriteUrl(
  umamiUrl: string,
  pathname: string,
  search: string,
) {
  return new URL(`${pathname.replace(/^\/stats/, '')}${search}`, umamiUrl)
}
