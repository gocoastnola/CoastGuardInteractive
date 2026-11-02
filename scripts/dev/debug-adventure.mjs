// Visual/log check of the adventure flow against the dev server (browser tool can't reach localhost).
// node scripts/dev/debug-adventure.mjs [zip] [outDir] [width] [height]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const zip = process.argv[2] ?? '70130'
const out = process.argv[3] ?? '/Users/solairstreamline/.openclaw/workspace/tmp/cgi-adv'
const width = Number(process.argv[4] ?? 1440)
const height = Number(process.argv[5] ?? 900)
mkdirSync(out, { recursive: true })

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width, height } })
const logs = []
p.on('console', (m) => { if (m.type() !== 'debug') logs.push(`[${m.type()}] ${m.text()}`) })
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
const shot = (n) => p.screenshot({ path: `${out}/${n}.png` })
const t0 = Date.now()
const at = () => ((Date.now() - t0) / 1000).toFixed(1)

await p.goto('http://127.0.0.1:5174/')
await p.waitForTimeout(1800)
await shot('a-landing')
await p.getByTestId('zip-input').fill(zip)
await p.keyboard.press('Enter')
await p.waitForSelector('[data-testid="journey-act1"]')
console.log(at(), 'act1 mounted')
await p.waitForTimeout(1500)
await shot('b-act1-frame')
await p.waitForTimeout(3200)
await shot('c-act1-arc')
console.log(at(), 'miles:', await p.getByTestId('miles-counter').innerText())
const arc = await p.evaluate(() => {
  const m = document.querySelector('[data-testid="journey-marker-home"]')?.getBoundingClientRect()
  const c = document.querySelector('[data-testid="journey-marker-bootcamp"]')?.getBoundingClientRect()
  return { home: m && [Math.round(m.x), Math.round(m.y)], cape: c && [Math.round(c.x), Math.round(c.y)] }
})
console.log('markers', JSON.stringify(arc))
await p.waitForTimeout(3500)
await shot('d-act1-arrive')
await p.waitForSelector('[data-testid="orders"]', { timeout: 20000 })
console.log(at(), 'orders mounted')
await p.waitForTimeout(3200)
await shot('e-orders')
const cards = await p.getByTestId('order-card').allInnerTexts()
console.log('cards', JSON.stringify(cards.map((c) => c.split('\n')[1])))
await p.getByTestId('order-card').first().click()
await p.waitForSelector('[data-testid="journey-act2"]')
console.log(at(), 'act2 mounted')
await p.waitForTimeout(4500)
await shot('f-act2-arc')
await p.waitForSelector('[data-testid="station-panel"]', { timeout: 20000 })
console.log(at(), 'panel mounted')
await p.waitForTimeout(3500)
await shot('g-first-unit')
console.log('title', await p.getByTestId('panel-title').innerText(), '| ribbon', await p.getByTestId('panel-ribbon').innerText())
await p.getByTestId('back-to-map').click()
await p.waitForTimeout(2500)
await shot('h-explore')
await p.getByTestId('restart-adventure').click()
await p.waitForTimeout(800)
console.log('landing again:', await p.getByTestId('landing').isVisible())
console.log('--- logs ---\n' + logs.join('\n'))
await b.close()
