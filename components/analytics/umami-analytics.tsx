import Script from 'next/script'

export function UmamiAnalytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const domains =
    process.env.NEXT_PUBLIC_UMAMI_DOMAINS || 'creations.adogrz.com'

  if (!websiteId) return null

  return (
    <Script
      src="/stats/script.js"
      data-website-id={websiteId}
      data-domains={domains}
      strategy="afterInteractive"
    />
  )
}
