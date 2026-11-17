import { expect, type Locator, type Page, type TestInfo } from '@playwright/test'

// Deterministic CI fixtures replace only third-party map style/media responses.
// MapLibre itself, its worker/route layers, GSAP timings, the ZIP table and WebAudio
// remain real. These fixtures do NOT verify external geography or photo availability.
const MEDIA_FIXTURE = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#26384c"/><text x="70" y="400" fill="white" font-size="48">TEST FIXTURE — remote photograph</text></svg>`
const STYLE_FIXTURE = {
  version: 8,
  name: 'Deterministic test basemap (no external geographic tiles)',
  sources: {},
  layers: [{ id: 'test-background', type: 'background', paint: { 'background-color': '#123047' } }],
}

declare global {
  interface Window {
    __audioContexts: AudioContext[]
    __journeyObserved: { phases: string[]; weeks: number[] }
  }
}

export async function deterministicMedia(page: Page, failImages = false, failPrimaryMap = false) {
  await page.route(/^https:\/\//, async (route) => {
    const request = route.request()
    if (/tiles\.openfreemap\.org\/styles\/|basemaps\.cartocdn\.com\/gl\//.test(request.url())) {
      if (failPrimaryMap && request.url().includes('tiles.openfreemap.org')) {
        return route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' }, body: 'Intentional primary-map outage fixture' })
      }
      return route.fulfill({ json: STYLE_FIXTURE, headers: { 'access-control-allow-origin': '*' } })
    }
    if (request.resourceType() === 'image') {
      return failImages
        ? route.fulfill({ status: 503, body: 'Intentional external-image outage fixture' })
        : route.fulfill({ contentType: 'image/svg+xml', body: MEDIA_FIXTURE })
    }
    return route.continue()
  })
  await page.addInitScript(() => {
    window.__audioContexts = []
    const NativeAudioContext = window.AudioContext
    if (NativeAudioContext) {
      window.AudioContext = class extends NativeAudioContext {
        constructor(options?: AudioContextOptions) {
          super(options)
          window.__audioContexts.push(this)
        }
      }
    }
  })
}

export async function openLanding(page: Page) {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Enter your ZIP code')
  await expect(page.getByTestId('zip-input')).toBeFocused()
  await expect(page.getByText('Independent educational demonstration', { exact: false })).toBeVisible()
  await expect(page.locator('.maplibregl-canvas')).toHaveCount(1)
  await expect(page.locator('.map-status')).toHaveCount(0)
}

export async function phase(page: Page, name: string, timeout = 20_000) {
  await expect(page.locator('.app')).toHaveAttribute('data-phase', name, { timeout })
}

export async function opaque(locator: Locator, timeout = 12_000) {
  await expect(locator).toBeVisible({ timeout })
  await expect.poll(() => locator.evaluate((el) => {
    let opacity = 1
    for (let node: Element | null = el; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity)
    return opacity
  }), { timeout }).toBeGreaterThan(0.95)
}

export async function beginZip(page: Page, zip = '70130') {
  await page.getByTestId('zip-input').fill(zip)
  await page.getByTestId('zip-input').press('Enter')
  await phase(page, 'travel')
  await expect(page.getByTestId('landing')).toBeHidden()
  await expect(page.getByTestId('journey-marker-home')).toHaveCount(1)
  await expect(page.getByTestId('journey-marker-bootcamp')).toHaveCount(1)
}

export async function observeJourney(page: Page) {
  await page.evaluate(() => {
    const app = document.querySelector<HTMLElement>('.app')!
    const observed = window.__journeyObserved = { phases: [app.dataset.phase!], weeks: [] as number[] }
    new MutationObserver(() => {
      const p = app.dataset.phase!
      if (observed.phases.at(-1) !== p) observed.phases.push(p)
      const match = document.querySelector('[data-testid="week-value"]')?.textContent?.match(/Week\s+(\d+)/)
      if (match && !observed.weeks.includes(Number(match[1]))) observed.weeks.push(Number(match[1]))
    }).observe(app, { attributes: true, attributeFilter: ['data-phase'], childList: true, characterData: true, subtree: true })
  })
}

export async function imageLoaded(locator: Locator) {
  await expect.poll(() => locator.evaluate((img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0)).toBe(true)
}

export async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

export async function controlInViewport(page: Page, locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  const viewport = page.viewportSize()!
  expect(box!.x).toBeGreaterThanOrEqual(-1)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box!.y).toBeGreaterThanOrEqual(-1)
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
}

export async function screenshot(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path })
  await testInfo.attach(name, { path, contentType: 'image/png' })
}

export async function reachShipBySkip(page: Page) {
  await beginZip(page)
  await page.keyboard.press('Escape')
  await phase(page, 'act1')
  await page.keyboard.press('Escape')
  await phase(page, 'orders')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('slot-landed')).toContainText('USCGC Polar Star')
  await page.getByTestId('slot-report').click()
  await phase(page, 'act2')
  await page.keyboard.press('Escape')
  await phase(page, 'shipIntro')
}
