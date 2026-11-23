import { test, expect } from '@playwright/test'
import { beginZip, deterministicMedia } from './helpers'

test('bundled NASA Earth imagery actually loads on the globe @deploy-smoke', async ({ page, request }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await deterministicMedia(page)
  const earthResponses: number[] = []
  const errors: string[] = []
  page.on('response', response => {
    if (response.url().includes('/earth-tiles/')) earthResponses.push(response.status())
  })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const root = process.env.E2E_PRODUCTION ? '/CoastGuardInteractive/' : '/'
  const tile = await request.get(`${root}earth-tiles/2/1/1.jpg`)
  expect(tile.ok(), 'real same-origin NASA satellite tile must exist').toBe(true)
  expect(tile.headers()['content-type']).toContain('image/jpeg')
  expect((await tile.body()).byteLength).toBeGreaterThan(2000)
  await beginZip(page)
  await expect(page.locator('.maplibregl-canvas')).toHaveAttribute('data-earth-imagery', 'nasa-blue-marble')
  await expect.poll(() => earthResponses.filter(status => status === 200).length,
    { timeout: 15_000 }).toBeGreaterThan(0)
  expect(earthResponses.every(status => status === 200), 'no missing satellite tiles').toBe(true)
  await testInfo.attach('real-nasa-globe-zip', { body: await page.screenshot(), contentType: 'image/png' })
  expect(errors).toEqual([])
})
