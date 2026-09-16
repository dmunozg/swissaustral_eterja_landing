import { readFileSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { injectPrerender } from '../src/prerender.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ssrOutDir = path.join(root, 'node_modules', '.eterja-ssr')
const distIndexHtml = path.join(root, 'dist', 'index.html')
const ssrEntryFile = 'entry-server.js'

function parseMode(argv) {
  const index = argv.indexOf('--mode')
  if (index === -1) return 'production'
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) {
    console.error('scripts/build.mjs: --mode requires a value (e.g. --mode test)')
    process.exit(1)
  }
  return value
}

const mode = parseMode(process.argv.slice(2))

const shared = {
  root,
  configFile: path.join(root, 'vite.config.js'),
  mode,
}

function verifyPrerenderedHtml(html) {
  const required = [
    ['the page H1', 'From the Patagonian ice field to your formulation.'],
    ['the mechanism CTA', 'href="#mechanism"'],
    ['the contact CTAs', 'href="#contact"'],
    ['the contact form', '<form'],
    ['the Turnstile placeholder', 'min-h-[65px]'],
    ['the references section', 'References'],
    ['a reference DOI link', 'https://doi.org/10.3390/biom5020545'],
    ['the canonical URL', 'https://swissaustral.com/eterja/'],
  ]
  for (const [label, marker] of required) {
    if (!html.includes(marker)) {
      throw new Error(
        `[eterja] prerender verification failed: missing ${label} (${JSON.stringify(marker)})`,
      )
    }
  }
}

async function main() {
  console.log(`[eterja] client build (mode: ${mode})`)
  await build(shared)

  console.log('[eterja] temporary SSR build')
  await build({
    ...shared,
    logLevel: 'warn',
    publicDir: false,
    build: {
      ssr: 'src/entry-server.jsx',
      outDir: ssrOutDir,
      emptyOutDir: true,
    },
  })

  try {
    const { render } = await import(
      pathToFileURL(path.join(ssrOutDir, ssrEntryFile)).href
    )
    const markup = render()
    const html = injectPrerender(readFileSync(distIndexHtml, 'utf8'), markup)
    verifyPrerenderedHtml(html)
    writeFileSync(distIndexHtml, html)
    console.log('[eterja] prerendered markup injected into dist/index.html')
  } finally {
    await rm(ssrOutDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
