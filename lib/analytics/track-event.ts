type AnalyticsEvent =
  | { name: 'contact-whatsapp'; data: { costume?: string } }
  | { name: 'contact-messenger'; data: { costume?: string } }
  | { name: 'contact-instagram'; data: { costume?: string } }
  | { name: 'share-costume'; data: { costume: string } }
  | { name: 'catalog-search'; data: { query: string } }
  | { name: 'catalog-filter'; data: { category: string } }

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(event.name, event.data)
  }
}
