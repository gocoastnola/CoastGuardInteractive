import { test, expect } from '@playwright/test'
import { beginZip, controlInViewport, deterministicMedia, imageLoaded, noHorizontalOverflow, openLanding, phase, reachShipBySkip } from './helpers'

test('user gesture initializes actual WebAudio; interruption does not create another context @production', async ({ page }) => {
  await deterministicMedia(page)
  await openLanding(page)
  expect(await page.evaluate(() => window.__audioContexts.length)).toBe(0)
  await beginZip(page)
  await expect.poll(() => page.evaluate(() => window.__audioContexts[0]?.state)).toBe('running')
  await page.keyboard.press('Escape')
  await phase(page, 'act1')
  await page.keyboard.press('Escape')
  await phase(page, 'orders')
  await page.evaluate(() => window.__audioContexts[0].suspend())
  expect(await page.evaluate(() => window.__audioContexts[0].state)).toBe('suspended')
  await page.getByTestId('slot-spin').click()
  await expect.poll(() => page.evaluate(() => window.__audioContexts[0].state)).toBe('running')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('slot-landed')).toContainText('Polar Star')
  expect(await page.evaluate(() => window.__audioContexts.length)).toBe(1)
})

test('project subpath serves real ZIP data, bundled exterior media and map worker @production', async ({ page, request }) => {
  await deterministicMedia(page)
  const localFailures: string[] = []
  const workerResponses: string[] = []
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) localFailures.push(response.url())
    if (response.url().includes('maplibre-gl-worker') && response.ok()) workerResponses.push(response.url())
  })
  await openLanding(page)
  const basePath = process.env.E2E_PRODUCTION ? '/CoastGuardInteractive/' : '/'
  if (process.env.E2E_PRODUCTION) expect(new URL(page.url()).pathname).toBe(basePath)
  const zipData = await request.get(`${basePath}data/zips.json`)
  expect(zipData.ok()).toBe(true)
  expect((await zipData.json())['70130']).toHaveLength(2)
  await reachShipBySkip(page)
  await imageLoaded(page.locator('.ship-hero img'))
  await imageLoaded(page.locator('.ship-gallery img').first())
  await expect(page.locator('.ship-hero img')).toHaveAttribute('src', `${basePath}media/polar-star-hero.jpg`)
  await expect.poll(() => workerResponses.length).toBeGreaterThan(0)
  expect(localFailures).toEqual([])
})

test('remote-photo outage yields honest placeholders rather than rejected imagery @production', async ({ page }) => {
  await deterministicMedia(page, true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openLanding(page)
  await beginZip(page)
  await page.getByTestId('journey-continue').click()
  await phase(page, 'act1')
  await expect(page.getByTestId('training-static')).toBeVisible()
  await expect(page.getByTestId('media-unavailable').first()).toContainText(/unavailable/i)
  await expect(page.locator('img[src*="port-wellington"],img[src*="port-rio"],img[src*="polar-star-crew"]')).toHaveCount(0)
  await page.getByTestId('journey-continue').click()
  await phase(page, 'orders')
  await page.getByTestId('slot-spin').click()
  await page.getByTestId('slot-report').click()
  await phase(page, 'act2')
  await page.getByTestId('journey-continue').click()
  await phase(page, 'shipIntro')
  await expect(page.getByTestId('media-unavailable')).toContainText(/unavailable/i)
  await imageLoaded(page.locator('.ship-hero img'))
  await controlInViewport(page, page.getByTestId('ship-begin'))
})

test('reduced mobile layout keeps essential controls reachable', async ({ page }) => {
  await deterministicMedia(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openLanding(page)
  await controlInViewport(page, page.getByTestId('zip-begin'))
  await reachShipBySkip(page)
  await controlInViewport(page, page.getByTestId('ship-begin'))
  await noHorizontalOverflow(page)
})

test('primary-style outage uses the existing map fallback without disabling exploration', async ({ page }) => {
  await deterministicMedia(page, false, true)
  const fallbackResponses: string[] = []
  page.on('response', response => {
    if (response.url().includes('basemaps.cartocdn.com') && response.ok()) fallbackResponses.push(response.url())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openLanding(page)
  expect(fallbackResponses).toHaveLength(1)
  await page.getByTestId('explore').click()
  await phase(page, 'explore')
  await page.getByTestId('directory-toggle').click()
  await page.getByTestId('directory-search').fill('kodiak')
  await page.getByTestId('directory-item').click()
  await expect(page.getByTestId('panel-title')).toHaveText('Air Station Kodiak')
})
