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
  await explorationMarkers(page, true)
  await noAssignmentSpoilers(page)
}

const ASSIGNMENT_SPOILERS = /Polar\s*Star|Seattle|Antarct\w*|McMurdo/i

/** Check what applicants can read/hear, not the preloaded unit dataset. */
export async function noAssignmentSpoilers(page: Page, ordersReady = false) {
  if (ordersReady) {
    await expect(page.getByTestId('slot-landed')).toHaveCount(0)
    await expect(page.getByTestId('slot-final')).toHaveCount(0)
    await expect(page.getByTestId('slot-spin')).toBeVisible()
    // The reel is a list of possible units. Its clipped rows naturally contain
    // those unit names; they must not be mistaken for an announced assignment.
    for (const selector of ['.slot-head', '.orders-record', '[data-testid="slot-spin"]']) {
      const region = page.locator(selector)
      expect(await region.innerText()).not.toMatch(ASSIGNMENT_SPOILERS)
      expect(await region.ariaSnapshot()).not.toMatch(ASSIGNMENT_SPOILERS)
    }
  } else {
    expect(await page.locator('body').innerText()).not.toMatch(ASSIGNMENT_SPOILERS)
    expect(await page.locator('body').ariaSnapshot()).not.toMatch(ASSIGNMENT_SPOILERS)
  }
}

/** The owner-approved opening remains four actual photographs in four corners. */
export async function fourCornerPhotographs(page: Page) {
  const viewport = page.viewportSize()!
  await expect(page.locator('.mosaic-tile')).toHaveCount(4)
  for (let index = 0; index < 4; index++) {
    const tile = page.locator(`.mosaic-tile--${index}`)
    const image = tile.locator('img')
    await opaque(tile)
    await imageLoaded(image)
    await expect.poll(() => image.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.5)
    const box = (await tile.boundingBox())!
    expect(box.width).toBeGreaterThan(viewport.width * 0.4)
    expect(box.height).toBeGreaterThan(viewport.height * 0.4)
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    if (index % 2 === 0) expect(centre.x).toBeLessThan(viewport.width / 2)
    else expect(centre.x).toBeGreaterThan(viewport.width / 2)
    if (index < 2) expect(centre.y).toBeLessThan(viewport.height / 2)
    else expect(centre.y).toBeGreaterThan(viewport.height / 2)
  }
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

export function noOverlap(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }, message: string) {
  const horizontal = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const vertical = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  // Preserve the no-obscuring requirement for both stacked and side-by-side scenes.
  expect(horizontal <= 1 || vertical <= 1, message).toBe(true)
}

/** Verify the actual portrait chart, without reaching into React or map internals. */
export async function patrolGeography(page: Page, stop: string) {
  const card = (await page.getByTestId(`port-${stop}`).boundingBox())!
  const heading = (await page.locator('.patrol-head').boundingBox())!
  const counter = (await page.locator('.patrol-counter').boundingBox())!
  const dots = await page.locator('.map-root .journey-marker .jm-dot').evaluateAll(elements => elements.map(el => {
    const box = el.getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }))
  expect(dots.length, `${stop}: visited locations remain on the cumulative chart`).toBeGreaterThan(1)
  for (const dot of dots) {
    expect(dot.x, `${stop}: visited marker stays inside viewport`).toBeGreaterThanOrEqual(0)
    expect(dot.x, `${stop}: visited marker stays inside viewport`).toBeLessThanOrEqual(page.viewportSize()!.width)
    expect(dot.y, `${stop}: visited marker clears chapter heading`).toBeGreaterThanOrEqual(heading.y + heading.height)
    expect(dot.y, `${stop}: visited marker stays above the photograph`).toBeLessThanOrEqual(card.y)
  }
  const current = (await page.locator('.journey-marker.is-current .jm-dot').boundingBox())!
  // The wide Pacific frame has bearing0: Hobart/McMurdo lie west of Seattle.
  // A canonical +360° marker copy would incorrectly appear on its right.
  if (['hobart', 'mcmurdo'].includes(stop)) expect(current.x + current.width / 2).toBeLessThan(dots[0].x)
  const label = (await page.locator('.journey-marker.is-current .jm-label').boundingBox())!
  noOverlap(label, card, `${stop}: active label must clear the photograph`)
  noOverlap(label, counter, `${stop}: active label must clear mileage`)
  noOverlap(label, heading, `${stop}: active label must clear chapter heading`)
}

export async function explorationMarkers(page: Page, hidden: boolean) {
  const markers = page.getByTestId('marker')
  await expect(markers).toHaveCount(18)
  await expect.poll(() => markers.evaluateAll((elements, storyHidden) => elements.every((element) => {
    const button = element as HTMLButtonElement
    const display = getComputedStyle(button).display
    return storyHidden
      ? button.hidden && display === 'none' && button.tabIndex === -1 && button.getAttribute('aria-hidden') === 'true'
      : !button.hidden && display !== 'none' && button.tabIndex === 0 && button.getAttribute('aria-hidden') !== 'true'
  }), hidden)).toBe(true)
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
