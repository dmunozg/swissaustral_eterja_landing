import assert from 'node:assert/strict'
import { test } from 'node:test'
import { trackGenerateLead } from './google-tag.js'

test('emits only the lead event when the data layer is available', () => {
  const dataLayer = []
  globalThis.window = { dataLayer }
  try {
    trackGenerateLead()
    assert.deepEqual(dataLayer, [{ event: 'generate_lead' }])
  } finally {
    delete globalThis.window
  }
})

test('no-ops without creating a data layer when window is unavailable', () => {
  delete globalThis.window
  assert.doesNotThrow(() => trackGenerateLead())
})

test('no-ops without creating a data layer when dataLayer is unavailable', () => {
  globalThis.window = {}
  try {
    assert.doesNotThrow(() => trackGenerateLead())
    assert.equal(globalThis.window.dataLayer, undefined)
  } finally {
    delete globalThis.window
  }
})
