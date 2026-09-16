import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/

const CLOUDFLARE_TEST_TURNSTILE_SITE_KEYS = new Set([
  '1x00000000000000000000AA',
  '2x00000000000000000000AB',
  '1x00000000000000000000BB',
  '2x00000000000000000000BB',
  '3x00000000000000000000FF',
])

function googleTagManager(id) {
  const headSnippet = `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`
  const bodySnippet = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`
  return {
    name: 'eterja-google-tag-manager',
    transformIndexHtml(html) {
      if (html.includes('googletagmanager.com')) return html
      return html
        .replace(/<head[^>]*>/i, (match) => `${match}${headSnippet}`)
        .replace(/<body[^>]*>/i, (match) => `${match}${bodySnippet}`)
    },
  }
}

export default defineConfig(({ command, mode }) => {
  const {
    VITE_GOOGLE_TAG_MANAGER_ID: gtmId,
    VITE_TURNSTILE_SITE_KEY: siteKey,
  } = loadEnv(mode, process.cwd(), 'VITE_')
  if (gtmId !== undefined && !GTM_ID_PATTERN.test(gtmId)) {
    throw new Error('VITE_GOOGLE_TAG_MANAGER_ID must match /^GTM-[A-Z0-9]+$/.')
  }
  if (command === 'build' && mode === 'production') {
    if (!gtmId) {
      throw new Error('VITE_GOOGLE_TAG_MANAGER_ID is required for production builds.')
    }
    const turnstileSiteKey = siteKey?.trim()
    if (!turnstileSiteKey) {
      throw new Error('VITE_TURNSTILE_SITE_KEY is required for production builds.')
    }
    if (CLOUDFLARE_TEST_TURNSTILE_SITE_KEYS.has(turnstileSiteKey)) {
      throw new Error('VITE_TURNSTILE_SITE_KEY must not be a Cloudflare test site key for production builds.')
    }
  }
  return {
    base: command === 'build' ? '/eterja/' : '/',
    plugins: [react(), tailwindcss(), ...(gtmId ? [googleTagManager(gtmId)] : [])],
  }
})
