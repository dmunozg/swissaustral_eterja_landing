import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

function componentSource(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

const components = [
  {
    name: 'Header',
    logo: 'logo_header.png',
    source: componentSource('./components/Header.jsx'),
  },
  {
    name: 'Footer',
    logo: 'logo_footer.png',
    source: componentSource('./components/Footer.jsx'),
  },
]

for (const { name, logo, source } of components) {
  test(`${name} builds the ${logo} src from import.meta.env.BASE_URL`, () => {
    assert.match(
      source,
      new RegExp(`import\\.meta\\.env\\.BASE_URL\\}\\s*(?!/\\s*)${logo}\\b`),
      `expected ${logo} to be referenced through import.meta.env.BASE_URL`,
    )
  })

  test(`${name} does not reference ${logo} as a root-absolute path`, () => {
    assert.doesNotMatch(
      source,
      new RegExp(`["']\\s*/?\\s*${logo}\\s*["']`),
      `${logo} must not be referenced as a root-absolute literal path`,
    )
  })
}
