export function trackGenerateLead() {
  if (typeof window === 'undefined' || !Array.isArray(window.dataLayer)) return
  window.dataLayer.push({ event: 'generate_lead' })
}
