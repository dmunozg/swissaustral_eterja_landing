import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { injectPrerender } from './prerender.js'

const GTM_ID = 'GTM-TEST123'
const REAL_SITE_KEY = '0x4AAAAAAAAAAAAAAAAAAAAAAA'
const CANONICAL_URL = 'https://swissaustral.com/eterja/'
const SOCIAL_IMAGE_URL = 'https://swissaustral.com/eterja/eterja-social.jpg'
const PAGE_TITLE =
  'Swissaustral® Eterja SC — Recombinant SOD + Catalase System'
const PAGE_DESCRIPTION =
  'Swissaustral® Eterja SC pairs recombinant superoxide dismutase and catalase in a complementary two-step system, rooted in an extremophilic organism from the Southern Patagonian Ice Field.'
const TEST_SITE_KEYS = [
  '1x00000000000000000000AA',
  '2x00000000000000000000AB',
  '1x00000000000000000000BB',
  '2x00000000000000000000BB',
  '3x00000000000000000000FF',
]

process.env.VITE_GOOGLE_TAG_MANAGER_ID = GTM_ID
process.env.VITE_TURNSTILE_SITE_KEY = REAL_SITE_KEY

const originalCwd = process.cwd()
let isolatedCwd
before(async () => {
  isolatedCwd = await mkdtemp(path.join(os.tmpdir(), 'eterja-config-test-'))
  process.chdir(isolatedCwd)
})
after(async () => {
  try {
    process.chdir(originalCwd)
  } finally {
    await rm(isolatedCwd, { recursive: true, force: true })
  }
})

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
      `<head><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});`,
    ),
  )
  assert.ok(head.includes(`j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl`))
  assert.ok(head.includes(`})(window,document,'script','dataLayer','${GTM_ID}');`))
  assert.equal((head.match(/googletagmanager\.com\/gtm\.js/g) ?? []).length, 1)
})

function bootstrapSource(html) {
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
  const start = head.indexOf('<script>') + '<script>'.length
  return head.slice(start, head.indexOf('</script>'))
}

test('GTM bootstrap does not reassign the layer name parameter (default dataLayer url)', () => {
  const source = bootstrapSource(transformedHtml(GTM_ID))
  assert.ok(
    !/\bl\s*=\s*w\[l\]/.test(source),
    'the layer name parameter l must not be reassigned to the dataLayer array',
  )
  const inserted = []
  const windowStub = {}
  const documentStub = {
    getElementsByTagName: () => [
      { parentNode: { insertBefore: (node) => inserted.push(node) } },
    ],
    createElement: (tag) => ({ tagName: tag }),
  }
  new Function('window', 'document', source)(windowStub, documentStub)

  assert.ok(Array.isArray(windowStub.dataLayer))
  assert.equal(windowStub.dataLayer.length, 1)
  assert.equal(windowStub.dataLayer[0].event, 'gtm.js')
  assert.equal(typeof windowStub.dataLayer[0]['gtm.start'], 'number')
  assert.equal(inserted.length, 1)
  assert.equal(inserted[0].tagName, 'script')
  assert.equal(inserted[0].async, true)
  assert.equal(
    inserted[0].src,
    `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`,
  )
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

test('initial html defers the Turnstile script to the contact section', () => {
  const html = transformedHtml(GTM_ID)
  assert.ok(
    !html.includes('challenges.cloudflare.com/turnstile/v0/api.js'),
    'the Turnstile script must not be requested on initial page load',
  )
  assert.ok(
    html.includes('<link rel="preconnect" href="https://challenges.cloudflare.com" />'),
    'the challenges.cloudflare.com preconnect must stay for the deferred load',
  )
})

test('index.html preloads the hero image with a base-relative public path', () => {
  const preloads = [...indexHtml.matchAll(/<link[^>]+rel="preload"[^>]*>/g)]
  assert.equal(preloads.length, 1, 'expected exactly one preload link')
  assert.ok(preloads[0][0].includes('as="image"'))
  assert.ok(preloads[0][0].includes('href="/hero-section-background.jpg"'))
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

function metaContent(html, key) {
  const tag = html.match(
    new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]*>`),
  )
  assert.ok(tag, `missing <meta ${key}> in index.html`)
  const content = tag[0].match(/content="([^"]*)"/)
  assert.ok(content, `missing content attribute on <meta ${key}>`)
  return content[1]
}

function jsonLdScripts(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
}

test('index.html declares exactly one absolute canonical for the production URL', () => {
  const canonicals = [...indexHtml.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)]
  assert.equal(canonicals.length, 1)
  assert.ok(canonicals[0][0].includes(`href="${CANONICAL_URL}"`))
})

test('index.html declares the favicon with a base-relative public path', () => {
  const icons = [...indexHtml.matchAll(/<link[^>]+rel="icon"[^>]*>/g)]
  assert.equal(icons.length, 1)
  assert.ok(icons[0][0].includes('href="/favicon.png"'))
})

test('index.html declares Open Graph identity, URL, and image metadata', () => {
  assert.equal(metaContent(indexHtml, 'og:title'), PAGE_TITLE)
  assert.equal(metaContent(indexHtml, 'og:description'), PAGE_DESCRIPTION)
  assert.equal(metaContent(indexHtml, 'og:type'), 'website')
  assert.equal(metaContent(indexHtml, 'og:url'), CANONICAL_URL)
  assert.equal(metaContent(indexHtml, 'og:site_name'), 'SwissAustral')
  assert.equal(metaContent(indexHtml, 'og:image'), SOCIAL_IMAGE_URL)
  assert.equal(metaContent(indexHtml, 'og:image:width'), '1200')
  assert.equal(metaContent(indexHtml, 'og:image:height'), '630')
  assert.ok(metaContent(indexHtml, 'og:image:alt').length > 0)
})

test('index.html declares a Twitter summary card with the social image', () => {
  assert.equal(metaContent(indexHtml, 'twitter:card'), 'summary_large_image')
  assert.equal(metaContent(indexHtml, 'twitter:title'), PAGE_TITLE)
  assert.equal(metaContent(indexHtml, 'twitter:description'), PAGE_DESCRIPTION)
  assert.equal(metaContent(indexHtml, 'twitter:image'), SOCIAL_IMAGE_URL)
})

test('index.html contains exactly one parseable JSON-LD graph of visible facts', () => {
  const scripts = jsonLdScripts(indexHtml)
  assert.equal(scripts.length, 1)
  const graph = JSON.parse(scripts[0][1])
  assert.equal(graph['@context'], 'https://schema.org')
  const nodes = Object.fromEntries(graph['@graph'].map((node) => [node['@type'], node]))
  const page = nodes.WebPage
  const product = nodes.Product
  const brand = nodes.Brand
  assert.ok(page && product && brand, 'expected WebPage, Product, and Brand nodes')
  assert.equal(page.url, CANONICAL_URL)
  assert.equal(page.name, PAGE_TITLE)
  assert.equal(product.brand['@id'], brand['@id'])
  assert.equal(brand.name, 'SwissAustral')
  assert.equal(product.image, SOCIAL_IMAGE_URL)
  assert.ok(product.name.includes('Eterja SC'))
  assert.ok(product.description.length > 0)
  const serialized = scripts[0][1]
  for (const forbidden of [
    'Offer',
    'AggregateRating',
    'Review',
    'FAQPage',
    'Medical',
    'price',
    'ratingValue',
  ]) {
    assert.ok(
      !serialized.includes(forbidden),
      `JSON-LD must not contain "${forbidden}" (no fabricated commerce or medical data)`,
    )
  }
})

test('static page metadata is ordered after the GTM head snippet', () => {
  const html = transformedHtml(GTM_ID)
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
  const gtmEnd = head.indexOf('</script>')
  assert.ok(gtmEnd > -1)
  for (const marker of [
    'rel="canonical"',
    'rel="icon"',
    'property="og:title"',
    'name="twitter:card"',
    'application/ld+json',
  ]) {
    const index = head.indexOf(marker)
    assert.ok(index > -1, `missing ${marker} in the built head`)
    assert.ok(index > gtmEnd, `${marker} must stay after the GTM snippet`)
  }
})

function jpegDimensions(buffer) {
  assert.equal(buffer[0], 0xff, 'expected JPEG SOI marker')
  assert.equal(buffer[1], 0xd8, 'expected JPEG SOI marker')
  let offset = 2
  while (offset + 4 < buffer.length) {
    assert.equal(buffer[offset], 0xff, 'expected JPEG marker')
    const marker = buffer[offset + 1]
    const size = buffer.readUInt16BE(offset + 2)
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      }
    }
    offset += 2 + size
  }
  throw new Error('no SOF marker found')
}

test('built prerendered index.html serves metadata, preload, and images beneath /eterja/', async () => {
  const { build } = await import('vite')
  const root = fileURLToPath(new URL('..', import.meta.url))
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'eterja-build-'))
  const ssrOutDir = path.join(root, 'node_modules', '.eterja-test-ssr')
  const configFile = fileURLToPath(new URL('../vite.config.js', import.meta.url))
  const previousGtm = process.env.VITE_GOOGLE_TAG_MANAGER_ID
  const previousKey = process.env.VITE_TURNSTILE_SITE_KEY
  process.env.VITE_GOOGLE_TAG_MANAGER_ID = GTM_ID
  process.env.VITE_TURNSTILE_SITE_KEY = REAL_SITE_KEY
  try {
    await build({
      root,
      configFile,
      mode: 'production',
      logLevel: 'error',
      build: { outDir, emptyOutDir: false },
    })
    await build({
      root,
      configFile,
      mode: 'production',
      logLevel: 'error',
      publicDir: false,
      build: { ssr: 'src/entry-server.jsx', outDir: ssrOutDir, emptyOutDir: true },
    })
    const built = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    assert.ok(built.includes(`href="${CANONICAL_URL}"`), 'canonical must survive the build')
    assert.ok(
      built.includes('href="/eterja/favicon.png"'),
      'Vite must rewrite the public favicon path with the /eterja/ base',
    )
    assert.ok(!built.includes('href="/favicon.png"'))
    readFileSync(path.join(outDir, 'favicon.png'))
    assert.ok(
      built.includes(`content="${SOCIAL_IMAGE_URL}"`),
      'social image must keep its absolute production URL',
    )
    const { width, height } = jpegDimensions(
      readFileSync(path.join(outDir, 'eterja-social.jpg')),
    )
    assert.equal(width, 1200)
    assert.equal(height, 630)

    const prerendered = injectPrerender(
      built,
      (await import(pathToFileURL(path.join(ssrOutDir, 'entry-server.js')).href)).render(),
    )
    assert.ok(
      prerendered.includes('rel="preload" as="image" href="/eterja/hero-section-background.jpg"'),
      'Vite must rewrite the hero preload with the /eterja/ base',
    )
    assert.ok(
      !prerendered.includes('challenges.cloudflare.com/turnstile/v0/api.js'),
      'the Turnstile script must not be eager in the built html',
    )
    const entryMatch = prerendered.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)
    assert.ok(entryMatch, 'built html must reference the module entry')
    const entryJs = readFileSync(
      path.join(outDir, entryMatch[1].replace(/^\/eterja\//, '')),
      'utf8',
    )
    assert.ok(
      entryJs.includes('challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'),
      'the deferred Turnstile loader must ship in the client bundle',
    )
    const imgs = [...prerendered.matchAll(/<img\b[^>]*>/g)]
    assert.equal(imgs.length, 6, 'expected the six landing images')
    const headerImg = imgs.find((img) => img[0].includes('logo_header.png'))
    assert.ok(headerImg, 'header logo missing from the prerendered html')
    assert.ok(!/loading=/.test(headerImg[0]), 'header logo must stay eager')
    for (const img of imgs) {
      assert.ok(
        /width="\d+"/.test(img[0]),
        `image is missing its intrinsic width: ${img[0].slice(0, 100)}`,
      )
      assert.ok(
        /height="\d+"/.test(img[0]),
        `image is missing its intrinsic height: ${img[0].slice(0, 100)}`,
      )
    }
    const deferredImgs = imgs.filter((img) => !img[0].includes('logo_header.png'))
    assert.equal(deferredImgs.length, 5, 'expected five below-fold images')
    for (const img of deferredImgs) {
      assert.ok(
        img[0].includes('loading="lazy"'),
        `below-fold image must be lazy: ${img[0].slice(0, 100)}`,
      )
      assert.ok(
        img[0].includes('decoding="async"'),
        `below-fold image must decode async: ${img[0].slice(0, 100)}`,
      )
    }
  } finally {
    if (previousGtm === undefined) delete process.env.VITE_GOOGLE_TAG_MANAGER_ID
    else process.env.VITE_GOOGLE_TAG_MANAGER_ID = previousGtm
    if (previousKey === undefined) delete process.env.VITE_TURNSTILE_SITE_KEY
    else process.env.VITE_TURNSTILE_SITE_KEY = previousKey
    await rm(outDir, { recursive: true, force: true })
    await rm(ssrOutDir, { recursive: true, force: true })
  }
})
