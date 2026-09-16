import assert from 'node:assert/strict'
import { test } from 'node:test'
import { injectPrerender } from './prerender.js'

function htmlWithOutlets(times) {
  const outlet = '<div id="root"></div>'
  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head><title>Eterja</title></head>',
    '  <body>',
    ...Array.from({ length: times }, () => `    ${outlet}`),
    '    <script type="module" src="/eterja/assets/index.js"></script>',
    '  </body>',
    '</html>',
  ].join('\n')
}

const MARKUP =
  '<div class="min-h-screen"><h1>From the Patagonian ice field to your formulation.</h1></div>'

test('injects the prerendered markup into the single outlet', () => {
  const result = injectPrerender(htmlWithOutlets(1), MARKUP)
  assert.ok(result.includes(`<div id="root">${MARKUP}</div>`))
  assert.ok(!result.includes('<div id="root"></div>'))
})

test('leaves everything outside the outlet untouched', () => {
  const html = htmlWithOutlets(1)
  const result = injectPrerender(html, MARKUP)
  assert.equal(
    result.split('<div id="root">')[0],
    html.split('<div id="root">')[0],
  )
  assert.ok(result.includes('<script type="module" src="/eterja/assets/index.js"></script>'))
  assert.ok(result.includes('<title>Eterja</title>'))
})

test('rejects built HTML without the outlet', () => {
  assert.throws(
    () => injectPrerender(htmlWithOutlets(0), MARKUP),
    /prerender outlet .* not found/i,
  )
})

test('rejects built HTML with duplicate outlets', () => {
  assert.throws(
    () => injectPrerender(htmlWithOutlets(2), MARKUP),
    /exactly one prerender outlet, found 2/,
  )
})

test('rejects empty rendered output', () => {
  for (const markup of ['', '   ', '\n\t ']) {
    assert.throws(
      () => injectPrerender(htmlWithOutlets(1), markup),
      /rendered markup is empty/i,
      `expected ${JSON.stringify(markup)} to be rejected`,
    )
  }
})
