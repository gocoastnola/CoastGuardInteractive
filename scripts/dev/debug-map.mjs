import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 675 } })
const logs = []
p.on('console', m => logs.push(`[${m.type()}] ${m.text()}`))
p.on('pageerror', e => logs.push(`[pageerror] ${e.message}`))
await p.goto('http://127.0.0.1:5174/')
await p.waitForTimeout(1500)
await p.getByTestId('explore').click()
await p.waitForTimeout(5000)
const info = await p.evaluate(() => {
  const c = document.querySelector('.maplibregl-canvas')
  const m = document.querySelector('[data-unit-id="station-grand-isle"]')
  const r = m?.getBoundingClientRect()
  const mc = m?.closest('.maplibregl-marker')
  const gl = c?.getContext('webgl2') || c?.getContext('webgl')
  return {
    canvas: c ? { w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight } : null,
    hasGL: !!gl,
    markerRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null,
    markerParentStyle: mc ? mc.getAttribute('style') : null,
    markerCount: document.querySelectorAll('.maplibregl-marker').length,
    mapRootRect: document.querySelector('.map-canvas')?.getBoundingClientRect().toJSON(),
  }
})
console.log(JSON.stringify(info, null, 2))
console.log(logs.slice(0, 30).join('\n'))
await p.locator('[data-unit-id="station-grand-isle"]').click({ force: true })
await p.waitForTimeout(2500)
const panel = await p.evaluate(() => {
  const el = document.querySelector('[data-testid="station-panel"]')
  if (!el) return null
  const cs = getComputedStyle(el)
  const t = el.querySelector('[data-testid="panel-title"]')
  return { opacity: cs.opacity, transform: cs.transform, rect: el.getBoundingClientRect().toJSON(), titleOpacity: t && getComputedStyle(t).opacity, titleTransform: t && getComputedStyle(t).transform }
})
console.log('PANEL', JSON.stringify(panel))
await p.screenshot({ path: '/Users/solairstreamline/.openclaw/workspace/tmp/cgi-shots/dbg.png' })
await b.close()
