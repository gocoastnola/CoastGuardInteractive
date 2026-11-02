import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const logs = []
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await p.goto('http://127.0.0.1:5174/')
await p.getByTestId('zip-input').fill('02108')
await p.keyboard.press('Enter')
await p.waitForSelector('[data-testid="journey-act1"]')
await p.waitForTimeout(2500)
await p.screenshot({ path: process.argv[2] + '/reduced-act1.png' })
console.log(logs.join('\n') || 'no page errors')
await b.close()
