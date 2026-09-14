import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const GTM_ID = 'GTM-TEST123'

process.env.VITE_GOOGLE_TAG_MANAGER_ID = GTM_ID

const { default: resolveConfig } = await import('../vite.config.js')

const indexHtml = readFileSync(
  fileURLToPath(new URL('../index.html', import.meta.url)),
  'utf8',
)

function transformedHtml(gtmId) {
  const previous = process.env.VITE_GOOGLE_TAG_MANAGER_ID
  if (gtmId === undefined) delete process.env.VITE_GOOGLE_TAG_MANAGER_ID
  else process.env.VITE_GOOGLE_TAG_MANAGER_ID = gtmId
  try {
    const config = resolveConfig({ command: 'build', mode: 'production' })
    const plugin = config.plugins.find(
      (entry) => entry.name === 'eterja-google-tag-manager',
    )
    assert.ok(plugin)
    return plugin.transformIndexHtml(indexHtml)
  } finally {
    if (previous === undefined) delete process.env.VITE_GOOGLE_TAG_MANAGER_ID
    else process.env.VITE_GOOGLE_TAG_MANAGER_ID = previous
  }
}

test('production build requires a GTM id', () => {
  const previous = process.env.VITE_GOOGLE_TAG_MANAGER_ID
  delete process.env.VITE_GOOGLE_TAG_MANAGER_ID
  assert.throws(
    () => resolveConfig({ command: 'build', mode: 'production' }),
    /VITE_GOOGLE_TAG_MANAGER_ID is required for production builds/,
  )
  process.env.VITE_GOOGLE_TAG_MANAGER_ID = previous
})

test('production build rejects malformed GTM ids', () => {
  for (const value of ['gtm-test123', 'GTM-', 'GTM-TEST 123', 'GTM_TEST123', '']) {
    const previous = process.env.VITE_GOOGLE_TAG_MANAGER_ID
    process.env.VITE_GOOGLE_TAG_MANAGER_ID = value
    assert.throws(
      () => resolveConfig({ command: 'build', mode: 'production' }),
      /VITE_GOOGLE_TAG_MANAGER_ID must match/,
    )
    process.env.VITE_GOOGLE_TAG_MANAGER_ID = previous
  }
})

test('development build without a GTM id omits the tag manager', () => {
  const previous = process.env.VITE_GOOGLE_TAG_MANAGER_ID
  delete process.env.VITE_GOOGLE_TAG_MANAGER_ID
  const config = resolveConfig({ command: 'serve', mode: 'development' })
  assert.ok(
    !config.plugins.some((plugin) => plugin.name === 'eterja-google-tag-manager'),
  )
  process.env.VITE_GOOGLE_TAG_MANAGER_ID = previous
})

test('injects the official GTM head snippet as the first head element', () => {
  const html = transformedHtml(GTM_ID)
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
  assert.ok(
    head.startsWith(
      `<head><script>(function(w,d,s,l,i){l=w[l]=w[l]||[];l.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`,
    ),
  )
  assert.ok(head.includes(`j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl`))
  assert.ok(head.includes(`})(window,document,'script','dataLayer','${GTM_ID}');`))
  assert.equal((head.match(/googletagmanager\.com\/gtm\.js/g) ?? []).length, 1)
})

test('injects the official GTM noscript iframe as the first body element', () => {
  const html = transformedHtml(GTM_ID)
  assert.ok(
    html.includes(
      `<body><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
    ),
  )
})

test('does not use the legacy gtag snippet', () => {
  const html = transformedHtml(GTM_ID)
  assert.ok(!html.includes('gtag'))
})

test('keeps the Turnstile script intact', () => {
  const html = transformedHtml(GTM_ID)
  assert.ok(html.includes('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'))
})
