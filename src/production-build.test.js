import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const GTM_ID = 'GTM-TEST123'
const REAL_SITE_KEY = '0x4AAAAAAAAAAAAAAAAAAAAAAA'
const TEST_SITE_KEYS = [
  '1x00000000000000000000AA',
  '2x00000000000000000000AB',
  '1x00000000000000000000BB',
  '2x00000000000000000000BB',
  '3x00000000000000000000FF',
]

process.env.VITE_GOOGLE_TAG_MANAGER_ID = GTM_ID
process.env.VITE_TURNSTILE_SITE_KEY = REAL_SITE_KEY

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

function withSiteKey(value, fn) {
  const previous = process.env.VITE_TURNSTILE_SITE_KEY
  if (value === undefined) delete process.env.VITE_TURNSTILE_SITE_KEY
  else process.env.VITE_TURNSTILE_SITE_KEY = value
  try {
    return fn()
  } finally {
    if (previous === undefined) delete process.env.VITE_TURNSTILE_SITE_KEY
    else process.env.VITE_TURNSTILE_SITE_KEY = previous
  }
}

test('production build requires a Turnstile site key', () => {
  withSiteKey(undefined, () =>
    assert.throws(
      () => resolveConfig({ command: 'build', mode: 'production' }),
      /VITE_TURNSTILE_SITE_KEY is required for production builds/,
    ),
  )
})

test('production build treats a blank Turnstile site key as missing', () => {
  withSiteKey('   ', () =>
    assert.throws(
      () => resolveConfig({ command: 'build', mode: 'production' }),
      /VITE_TURNSTILE_SITE_KEY is required for production builds/,
    ),
  )
})

test('production build rejects every known Cloudflare test site key', () => {
  for (const testKey of TEST_SITE_KEYS) {
    withSiteKey(testKey, () =>
      assert.throws(
        () => resolveConfig({ command: 'build', mode: 'production' }),
        /VITE_TURNSTILE_SITE_KEY must not be a Cloudflare test site key/,
      ),
    )
  }
})

test('production build accepts a real Turnstile site key', () => {
  withSiteKey(REAL_SITE_KEY, () => {
    const config = resolveConfig({ command: 'build', mode: 'production' })
    assert.ok(
      config.plugins.some((plugin) => plugin.name === 'eterja-google-tag-manager'),
    )
  })
})

test('test-mode build accepts a Cloudflare test site key', () => {
  for (const testKey of TEST_SITE_KEYS) {
    withSiteKey(testKey, () =>
      assert.doesNotThrow(() => resolveConfig({ command: 'build', mode: 'test' })),
    )
  }
})

test('test-mode build injects GTM when a container id is provided', () => {
  withSiteKey('1x00000000000000000000AA', () => {
    const config = resolveConfig({ command: 'build', mode: 'test' })
    const plugin = config.plugins.find(
      (entry) => entry.name === 'eterja-google-tag-manager',
    )
    assert.ok(plugin)
    const html = plugin.transformIndexHtml(indexHtml)
    assert.ok(html.includes('https://www.googletagmanager.com/gtm.js'))
    assert.ok(html.includes(`googletagmanager.com/ns.html?id=${GTM_ID}`))
  })
})

test('test-mode build without a Turnstile site key relies on the Contact fallback', () => {
  withSiteKey(undefined, () =>
    assert.doesNotThrow(() => resolveConfig({ command: 'build', mode: 'test' })),
  )
})

test('development build accepts missing and test Turnstile site keys', () => {
  withSiteKey(undefined, () =>
    assert.doesNotThrow(() => resolveConfig({ command: 'serve', mode: 'development' })),
  )
  for (const testKey of TEST_SITE_KEYS) {
    withSiteKey(testKey, () =>
      assert.doesNotThrow(() => resolveConfig({ command: 'serve', mode: 'development' })),
    )
  }
})
