const OUTLET_TAG = '<div id="root"></div>'

export function injectPrerender(html, markup) {
  if (typeof markup !== 'string' || markup.trim() === '') {
    throw new Error('injectPrerender: rendered markup is empty; refusing to build.')
  }
  if (typeof html !== 'string') {
    throw new Error('injectPrerender: built HTML must be a string.')
  }
  const outletCount = html.split(OUTLET_TAG).length - 1
  if (outletCount === 0) {
    throw new Error(
      `injectPrerender: prerender outlet <div id="root"></div> not found in built HTML.`,
    )
  }
  if (outletCount > 1) {
    throw new Error(
      `injectPrerender: expected exactly one prerender outlet, found ${outletCount}.`,
    )
  }
  return html.replace(OUTLET_TAG, `<div id="root">${markup}</div>`)
}
