// Boots the production preview in headless Chromium and asserts the map style loads without worker errors.
import { chromium } from '@playwright/test'
const url = process.argv[2] || 'http://127.0.0.1:5175/'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 675 } })
const errors = []
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
p.on('pageerror', (e) => errors.push(e.message))
await p.goto(url)
await p.getByTestId('explore').click()
await p.waitForTimeout(5000)
const ok = await p.evaluate(() => document.querySelectorAll('.maplibregl-canvas').length === 1 && document.querySelectorAll('[data-testid="marker"]').length >= 15)
const styleLoaded = await p.evaluate(() => !document.querySelector('.map-status'))
console.log(JSON.stringify({ url, markersAndCanvas: ok, styleLoaded, errors }))
await b.close()
