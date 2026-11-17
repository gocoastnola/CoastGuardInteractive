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
    __musicElements: HTMLMediaElement[]
    __oscillatorTimes: number[]
    __masterGains: GainNode[]
    __musicEndedCount: number
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
    window.__musicElements = []
    window.__oscillatorTimes = []
    window.__masterGains = []
    window.__musicEndedCount = 0
    const NativeAudioContext = window.AudioContext
    if (NativeAudioContext) {
      window.AudioContext = class extends NativeAudioContext {
        constructor(options?: AudioContextOptions) {
          super(options)
          window.__audioContexts.push(this)
        }
        createMediaElementSource(element: HTMLMediaElement): MediaElementAudioSourceNode {
          if (!window.__musicElements.includes(element)) window.__musicElements.push(element)
          element.addEventListener('ended', () => window.__musicEndedCount++)
          return super.createMediaElementSource(element)
        }
        createOscillator(): OscillatorNode {
          window.__oscillatorTimes.push(this.currentTime)
          return super.createOscillator()
        }
        createGain(): GainNode {
          const gain = super.createGain()
          const index = window.__audioContexts.indexOf(this)
          if (index >= 0 && !window.__masterGains[index]) window.__masterGains[index] = gain
          return gain
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

/** The native projection is reported from the live map after its style loads. */
export async function globeProjection(page: Page) {
  await expect(page.getByTestId('map')).toHaveAttribute('data-projection', 'vertical-perspective')
  await expect(page.getByTestId('map')).toHaveAttribute('data-world-copies', 'false')
  await expect(page.locator('.maplibregl-canvas')).toHaveCount(1)
}

type StageBox = { x: number; y: number; width: number; height: number }
function assertStage(stage: StageBox, viewport: { width: number; height: number }) {
  expect(stage.width * stage.height / (viewport.width * viewport.height), 'The globe remains the majority of the viewport').toBeGreaterThan(0.5)
  if (viewport.height > viewport.width) expect(stage.height / viewport.height).toBeGreaterThan(0.5)
  expect(stage.x).toBeGreaterThanOrEqual(-1)
  expect(stage.y).toBeGreaterThanOrEqual(-1)
  expect(stage.x + stage.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(stage.y + stage.height).toBeLessThanOrEqual(viewport.height + 1)
}

/** Reserve a real unobscured stage, rather than counting the full-screen canvas. */
export async function globeStage(page: Page) {
  const state = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="voyage-globe-stage"]')!.getBoundingClientRect()
    const map = document.querySelector('[data-testid="map"]')!
    return { stage: { x: stage.x, y: stage.y, width: stage.width, height: stage.height }, projection: map.getAttribute('data-projection'), worldCopies: map.getAttribute('data-world-copies'), canvases: document.querySelectorAll('.maplibregl-canvas').length }
  })
  expect(state.projection).toBe('vertical-perspective')
  expect(state.worldCopies).toBe('false')
  expect(state.canvases).toBe(1)
  assertStage(state.stage, page.viewportSize()!)
  return state.stage
}

/** Capture one arrival atomically: serial browser calls can outlast its3.8s hold. */
export async function patrolGeography(page: Page, stop: string) {
  const state = await page.evaluate(stop => {
    const rect = (selector: string) => {
      const box = document.querySelector(selector)!.getBoundingClientRect()
      return { x: box.x, y: box.y, width: box.width, height: box.height }
    }
    const alpha = (element: Element) => { let result = 1; for (let node: Element | null = element; node; node = node.parentElement) result *= Number(getComputedStyle(node).opacity); return result }
    const card = document.querySelector(`[data-testid="port-${stop}"]`)!
    const details = document.querySelector(`[data-testid="port-details-${stop}"]`)!
    const detailsBox = details.getBoundingClientRect()
    const detailsTarget = document.elementFromPoint(detailsBox.x + detailsBox.width / 2, detailsBox.y + detailsBox.height / 2)
    const marker = document.querySelector('.journey-marker.is-current')!
    const dot = marker.querySelector('.jm-dot')!
    const map = document.querySelector('[data-testid="map"]')!
    return {
      stage: rect('[data-testid="voyage-globe-stage"]'), card: rect(`[data-testid="port-${stop}"]`),
      heading: rect('.voyage-header'), counter: rect('.voyage-footer [data-testid="miles-counter"]'),
      current: rect('.journey-marker.is-current .jm-dot'), label: rect('.journey-marker.is-current .jm-label'),
      thumbnail: rect(`[data-testid="port-${stop}"] .voyage-thumb`), title: card.querySelector('h3')!.textContent,
      currentTitle: marker.querySelector('strong')!.textContent, currentAlpha: alpha(dot), cardAlpha: alpha(card),
      currentCovered: marker.classList.contains('maplibregl-marker-covered'),
      active: card.getAttribute('aria-hidden'), detailsVisible: getComputedStyle(details).visibility !== 'hidden' && details.getBoundingClientRect().height > 0,
      details: { x: detailsBox.x, y: detailsBox.y, width: detailsBox.width, height: detailsBox.height }, detailsReceivesPointer: detailsTarget === details || !!detailsTarget && details.contains(detailsTarget),
      counterAlpha: alpha(document.querySelector('.voyage-footer [data-testid="miles-counter"]')!),
      projection: map.getAttribute('data-projection'), worldCopies: map.getAttribute('data-world-copies'),
      canvases: document.querySelectorAll('.maplibregl-canvas').length, markerCount: document.querySelectorAll('.map-root .journey-marker').length,
      dialogs: document.querySelectorAll('[role="dialog"]').length, slides: card.querySelectorAll('.antarctic-slide').length,
      noOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
    }
  }, stop)
  const viewport = page.viewportSize()!
  expect(state.active, `${stop}: assertions refer to this active arrival`).toBe('false')
  expect(state.cardAlpha).toBeGreaterThan(0.95)
  expect(state.projection).toBe('vertical-perspective')
  expect(state.worldCopies).toBe('false')
  expect(state.canvases).toBe(1)
  assertStage(state.stage, viewport)
  expect(state.markerCount).toBeGreaterThan(1)
  expect(state.currentAlpha, `${stop}: current arrival is visible on the sphere`).toBeGreaterThan(0.95)
  expect(state.currentCovered).toBe(false)
  expect(state.currentTitle).toBe(state.title)
  expect(state.current.x + state.current.width / 2).toBeGreaterThanOrEqual(state.stage.x)
  expect(state.current.x + state.current.width / 2).toBeLessThanOrEqual(state.stage.x + state.stage.width)
  expect(state.current.y + state.current.height / 2).toBeGreaterThanOrEqual(state.stage.y)
  expect(state.current.y + state.current.height / 2).toBeLessThanOrEqual(state.stage.y + state.stage.height)
  noOverlap(state.label, state.card, `${stop}: active label must clear the photograph`)
  noOverlap(state.label, state.counter, `${stop}: active label must clear mileage`)
  noOverlap(state.label, state.heading, `${stop}: active label must clear chapter heading`)
  expect(state.title).not.toBe('')
  expect(state.detailsVisible).toBe(true)
  expect(state.detailsReceivesPointer, `${stop}: Details remains a real usable control`).toBe(true)
  expect(state.details.x).toBeGreaterThanOrEqual(0)
  expect(state.details.y).toBeGreaterThanOrEqual(0)
  expect(state.details.x + state.details.width).toBeLessThanOrEqual(viewport.width)
  expect(state.details.y + state.details.height).toBeLessThanOrEqual(viewport.height)
  expect(state.counterAlpha).toBeGreaterThan(0.95)
  expect(state.dialogs).toBe(0)
  expect(state.card.height, `${stop}: arrivals remain compact without an automatic photo takeover`).toBeLessThanOrEqual(104)
  expect(state.thumbnail.width * state.thumbnail.height / (viewport.width * viewport.height)).toBeLessThanOrEqual(0.2)
  noOverlap(state.card, state.counter, `${stop}: port card must not obscure cumulative mileage`)
  expect(state.noOverflow).toBe(true)
  return state
}

export async function explorationMarkers(page: Page, hidden: boolean) {
  const markers = page.getByTestId('marker')
  await expect(markers).toHaveCount(18)
  await expect.poll(() => markers.evaluateAll((elements, storyHidden) => elements.every((element) => {
    const button = element as HTMLButtonElement
    const display = getComputedStyle(button).display
    const box = button.getBoundingClientRect()
    const x = box.x + box.width / 2, y = box.y + box.height / 2
    const offscreen = x < 0 || y < 0 || x > innerWidth || y > innerHeight
    return storyHidden
      ? button.hidden && display === 'none' && button.tabIndex === -1 && button.getAttribute('aria-hidden') === 'true'
      : !button.hidden && display !== 'none' && (button.classList.contains('maplibregl-marker-covered') || offscreen
        ? button.tabIndex === -1 && button.getAttribute('aria-hidden') === 'true'
        : button.tabIndex === 0 && button.getAttribute('aria-hidden') !== 'true')
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

/** A visible credit control must also receive the pointer above other chrome. */
export async function attributionUsable(page: Page) {
  const credit = page.locator('.maplibregl-ctrl-attrib')
  await expect(credit).toBeInViewport()
  const toggle = credit.locator('.maplibregl-ctrl-attrib-button')
  if (await toggle.isVisible()) {
    await expect.poll(() => toggle.evaluate(element => {
      const box = element.getBoundingClientRect()
      const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return target === element || !!target && element.contains(target)
    }), { message: 'Provider attribution must receive a real pointer above the jump bar' }).toBe(true)
    const wasExpanded = await credit.locator('.maplibregl-ctrl-attrib-inner').isVisible()
    await toggle.click()
    if (wasExpanded) {
      // Native MapLibre initially expands compact credits; prove the toggle
      // closes them, then reopen deliberately rather than assuming its state.
      await expect(credit.locator('.maplibregl-ctrl-attrib-inner')).toBeHidden()
      await toggle.click()
    }
    await expect(credit.locator('.maplibregl-ctrl-attrib-inner')).toBeVisible()
    // CI's empty basemap fixture has no provider metadata. Live-resource review
    // separately verifies provider names; this assertion covers actual access.
    await expect(credit).toContainText(/Demo|OpenStreetMap|OpenFreeMap|CARTO/i)
  } else {
    await expect(credit.locator('.maplibregl-ctrl-attrib-inner')).toBeVisible()
  }
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
