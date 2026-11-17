import { expect, type Locator, type Page, type TestInfo } from '@playwright/test'
import type { Map as NativeMap } from 'maplibre-gl'
import { buildPatrolLegs, PATROL_STOPS, patrolMiles } from '../src/journey/patrol'

// Explicit owner-approved itinerary: omissions or reordered arrivals must fail.
export const PATROL_PORTS = ['honolulu', 'hobart', 'wellington', 'mcmurdo', 'punta-arenas', 'cape-horn', 'rio', 'panama', 'home-seattle']

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
    __journeyObserved: { phases: string[]; weeks: number[]; landHeadSeen: boolean; vesselBeforePatrol: boolean }
    __readPatrolArrival: ReturnType<typeof installPatrolProbe>['readArrival']
    __readPatrolVessel: ReturnType<typeof installPatrolProbe>['readVessel']
    __patrolObserved: { arrivals: { id: string; startMs: number; endMs?: number; geometry?: PatrolArrival; slides: number[]; opaqueMs: number }[]; startMs: number; recapMs?: number; lastFrameMs: number;
      vessel: { frames: number; instanceIds: number[]; maxCount: number; missingAfterMount: number; maxAnchorError: number; maxLineError: number; maxPositionError: number; maxLongitudeStep: number; crossedAntimeridian: boolean; lastLongitude?: number } }
  }
}

export async function deterministicMedia(page: Page, failImages = false, failPrimaryMap = false) {
  await page.addInitScript(installPatrolProbe)
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
  await expect(page.getByTestId('patrol-vessel')).toHaveCount(0)
  await explorationMarkers(page, true)
  await noAssignmentSpoilers(page)
}

const ASSIGNMENT_SPOILERS = /Polar\s*Star|Seattle|Antarct\w*|McMurdo/i

/** Check what applicants can read/hear, not the preloaded unit dataset. */
export async function noAssignmentSpoilers(page: Page, ordersReady = false) {
  await expect(page.getByTestId('patrol-vessel')).toHaveCount(0)
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
    const observed = window.__journeyObserved = { phases: [app.dataset.phase!], weeks: [] as number[], landHeadSeen: false, vesselBeforePatrol: false }
    new MutationObserver(() => {
      const p = app.dataset.phase!
      if (observed.phases.at(-1) !== p) observed.phases.push(p)
      const match = document.querySelector('[data-testid="week-value"]')?.textContent?.match(/Week\s+(\d+)/)
      if (match && !observed.weeks.includes(Number(match[1]))) observed.weeks.push(Number(match[1]))
    }).observe(app, { attributes: true, attributeFilter: ['data-phase'], childList: true, characterData: true, subtree: true })
    const frame = () => {
      if (app.dataset.phase === 'patrol' || app.dataset.phase === 'explore') return
      if (document.querySelector('[data-testid="patrol-vessel"]')) observed.vesselBeforePatrol = true
      if (app.dataset.phase === 'travel' && !observed.landHeadSeen) {
        observed.landHeadSeen = window.__readPatrolVessel().headVisibility === 'visible'
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
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

/** Install a passive DOM reader before brief touch-and-go arrivals begin. */
function installPatrolProbe() {
  const vesselIds = new WeakMap<Element, number>()
  let nextVesselId = 1
  const nativeMap = () => {
    const element = document.querySelector('.map-root')!
    type Fiber = { ref?: { current?: { getMap?: () => NativeMap } }; return?: Fiber }
    const key = Object.keys(element).find(key => key.startsWith('__reactFiber$'))!
    let fiber = (element as unknown as Record<string, Fiber>)[key]
    while (fiber && !fiber.ref?.current?.getMap) fiber = fiber.return!
    return fiber.ref!.current!.getMap!()
  }
  const readVessel = () => {
    const map = nativeMap()
    // MapLibre6 has no map._markers collection. Observe its actual positioned
    // native Marker element and project the live GeoJSON head through getMap().
    const elements = document.querySelectorAll<HTMLElement>('[data-testid="patrol-vessel"]')
    const element = elements[0]
    const sources = map.getStyle().sources as Record<string, { data?: { geometry?: { coordinates?: number[] | number[][] } } }>
    const route = sources['journey-arc']?.data?.geometry?.coordinates as number[][] | undefined
    const head = sources['journey-head']?.data?.geometry?.coordinates as number[] | undefined
    const lineEnd = route?.at(-1)
    const position = element ? [Number(element.dataset.lng), Number(element.dataset.lat)] : undefined
    const distance = (point?: number[]) => head && point
      ? Math.max(Math.abs((head[0] - point[0] + 540) % 360 - 180), Math.abs(head[1] - point[1])) : Infinity
    const box = element?.getBoundingClientRect()
    const projected = head && map.project([head[0], head[1]])
    const canvas = map.getCanvas().getBoundingClientRect()
    if (element && !vesselIds.has(element)) vesselIds.set(element, nextVesselId++)
    return {
      nativeCount: [...elements].filter(marker => marker.classList.contains('maplibregl-marker')).length, domCount: elements.length,
      instanceId: element ? vesselIds.get(element) : undefined,
      head, lineEnd, position, routeLength: route?.length ?? 0,
      lineError: distance(lineEnd), positionError: distance(position),
      anchorError: box && projected ? Math.hypot(box.x + box.width / 2 - canvas.x - projected.x,
        box.y + box.height / 2 - canvas.y - projected.y) : Infinity,
      covered: element?.classList.contains('maplibregl-marker-covered'), opacity: element ? Number(getComputedStyle(element).opacity) : 0,
      pointerEvents: element ? getComputedStyle(element).pointerEvents : undefined,
      decorative: element?.getAttribute('aria-hidden') === 'true' && element.tabIndex < 0,
      asset: element?.querySelector('img')?.getAttribute('src'),
      goldColor: map.getPaintProperty('journey-arc-line', 'line-color'),
      goldVisibility: map.getLayoutProperty('journey-arc-line', 'visibility') ?? 'visible',
      headVisibility: map.getLayoutProperty('journey-head-dot', 'visibility') ?? 'visible',
    }
  }
  const readArrival = (stop: string) => {
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
      vessel: readVessel(),
    }

  }
  window.__readPatrolArrival = readArrival
  window.__readPatrolVessel = readVessel
  return { readArrival, readVessel }
}

type PatrolArrival = ReturnType<ReturnType<typeof installPatrolProbe>['readArrival']>

/** Read one arrival in a single browser round trip. */
export async function patrolGeography(page: Page, stop: string) {
  return assertPatrolGeography(await page.evaluate(stop => window.__readPatrolArrival(stop), stop), page.viewportSize()!, stop)
}

function assertPatrolGeography(state: PatrolArrival, viewport: { width: number; height: number }, stop: string) {
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
  assertPatrolVessel(state.vessel)
  const expected = PATROL_STOPS.find(port => port.id === stop)!.lngLat
  expect(Math.abs((state.vessel.head![0] - expected[0] + 540) % 360 - 180), `${stop}: the vessel reaches this port's longitude`).toBeLessThan(1e-8)
  expect(state.vessel.head![1], `${stop}: the vessel reaches this port's latitude`).toBeCloseTo(expected[1], 8)
  return state
}

export async function nativePatrolVessel(page: Page) {
  return page.evaluate(() => window.__readPatrolVessel())
}

export function assertPatrolVessel(state: Awaited<ReturnType<typeof nativePatrolVessel>>) {
  expect(state.domCount, 'One vessel element is mounted').toBe(1)
  expect(state.nativeCount, 'The vessel uses the native MapLibre Marker positioning').toBe(1)
  expect(state.routeLength).toBeGreaterThan(1)
  expect(state.lineError, 'The native head source remains the exact gold polyline end').toBeLessThan(1e-8)
  expect(state.positionError, 'The position given to the native marker is the exact route head').toBeLessThan(1e-8)
  expect(state.anchorError, 'The vessel anchor follows the actual projected gold line end').toBeLessThan(1.1)
  expect(state.goldColor).toBe('#f4bd56')
  expect(state.goldVisibility).toBe('visible')
  expect(state.headVisibility, 'The previous head dot stays hidden while the ship leads').toBe('none')
  expect(state.decorative, 'The miniature ship is decoration rather than an extra focus target').toBe(true)
  expect(state.pointerEvents).toBe('none')
}

/** Sample real rendered arrivals without slowing or replacing the voyage clock. */
export async function observePatrol(page: Page) {
  await page.evaluate(() => {
    const observed = window.__patrolObserved = { arrivals: [], startMs: performance.now(), lastFrameMs: performance.now(),
      vessel: { frames: 0, instanceIds: [], maxCount: 0, missingAfterMount: 0, maxAnchorError: 0, maxLineError: 0, maxPositionError: 0, maxLongitudeStep: 0, crossedAntimeridian: false } } as Window['__patrolObserved']
    let previous: Window['__patrolObserved']['arrivals'][number] | undefined
    const frame = (now: number) => {
      if (document.querySelector('[data-testid="patrol"]')) {
        const state = window.__readPatrolVessel()
        const vessel = observed.vessel
        vessel.frames++
        vessel.maxCount = Math.max(vessel.maxCount, state.domCount)
        if (vessel.instanceIds.length && state.domCount !== 1) vessel.missingAfterMount++
        if (state.instanceId && !vessel.instanceIds.includes(state.instanceId)) vessel.instanceIds.push(state.instanceId)
        vessel.maxLineError = Math.max(vessel.maxLineError, state.lineError)
        if (state.domCount) vessel.maxPositionError = Math.max(vessel.maxPositionError, state.positionError)
        if (!state.covered && state.opacity > 0.95) vessel.maxAnchorError = Math.max(vessel.maxAnchorError, state.anchorError)
        if (state.head) {
          if (vessel.lastLongitude !== undefined) vessel.maxLongitudeStep = Math.max(vessel.maxLongitudeStep, Math.abs((state.head[0] - vessel.lastLongitude + 540) % 360 - 180))
          vessel.lastLongitude = state.head[0]
          if (state.head[0] < -180) vessel.crossedAntimeridian = true
        }
      }
      const card = document.querySelector<HTMLElement>('[data-port-card][aria-hidden="false"]')
      const id = card?.dataset.testid?.replace('port-', '')
      if (previous?.id !== id) {
        if (previous && !previous.endMs) previous.endMs = now
        previous = id ? { id, startMs: now, slides: [], opaqueMs: 0 } : undefined
        if (previous) observed.arrivals.push(previous)
      }
      if (card && previous) {
        const state = window.__readPatrolArrival(previous.id)
        if (state.cardAlpha > 0.95) {
          previous.geometry ??= state
          previous.opaqueMs += now - observed.lastFrameMs
        }
        card.querySelectorAll<HTMLElement>('[data-antarctic-slide]').forEach((slide, index) => {
          const image = slide.querySelector('img')
          if (slide.getAttribute('aria-hidden') === 'false' && Number(getComputedStyle(slide).opacity) > 0.95 && image?.complete && image.naturalWidth > 0 && !previous!.slides.includes(index)) previous!.slides.push(index)
        })
      }
      observed.lastFrameMs = now
      if (document.querySelector('[data-patrol-stage="recap"]')) { observed.recapMs = now; return }
      if (document.querySelector('[data-testid="patrol"]')) requestAnimationFrame(frame)
      else if (!observed.arrivals.length) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
}

export async function completedPatrolArrivals(page: Page) {
  await expect(page.getByTestId('patrol')).toHaveAttribute('data-patrol-stage', 'recap', { timeout: 50_000 })
  const observed = await page.evaluate(() => window.__patrolObserved)
  expect(observed.arrivals.map(arrival => arrival.id)).toEqual(PATROL_PORTS)
  for (const arrival of observed.arrivals) {
    expect(arrival.geometry, `${arrival.id}: the real arrival reached an opaque rendered frame`).toBeTruthy()
    assertPatrolGeography(arrival.geometry!, page.viewportSize()!, arrival.id)
    const holdMs = arrival.id === 'mcmurdo' ? 2400 : arrival.id === 'panama' ? 1800 : arrival.id === 'home-seattle' ? 2200 : 1400
    expect(arrival.endMs! - arrival.startMs, `${arrival.id}: shorter hold preserves the complete stop`).toBeGreaterThan(holdMs - 200)
    expect(arrival.endMs! - arrival.startMs, `${arrival.id}: arrival remains a quick touch-and-go`).toBeLessThan(holdMs + 1100)
    expect(arrival.opaqueMs, `${arrival.id}: port identity stays readable during its shorter hold`).toBeGreaterThan(holdMs * 0.5)
    if (arrival.id === 'mcmurdo') expect(arrival.slides).toEqual([0, 1, 2, 3])
  }
  expect(observed.recapMs! - observed.startMs, 'The complete nine-stop patrol is shorter than the former minute-long sequence').toBeLessThan(45_000)
  expect(observed.vessel.frames, 'Observe the actual vessel throughout the full voyage').toBeGreaterThan(50)
  expect(observed.vessel.instanceIds, 'All nine legs reuse the same mounted vessel').toHaveLength(1)
  expect(observed.vessel.maxCount).toBe(1)
  expect(observed.vessel.missingAfterMount).toBe(0)
  expect(observed.vessel.maxLineError).toBeLessThan(1e-8)
  expect(observed.vessel.maxPositionError).toBeLessThan(1e-8)
  expect(observed.vessel.maxAnchorError).toBeLessThan(1.1)
  expect(observed.vessel.crossedAntimeridian, 'The real ship passes180° across the Pacific route').toBe(true)
  expect(observed.vessel.maxLongitudeStep, 'Wrapped samples never jump to the other side of the globe').toBeLessThan(40)
  return observed
}

/** Read the actual native MapLibre camera/source; no bearing-only DOM proxy. */
export async function nativePatrolState(page: Page) {
  return page.locator('.map-root').evaluate(element => {
    type Fiber = { ref?: { current?: { getMap?: () => NativeMap } }; return?: Fiber }
    const key = Object.keys(element).find(key => key.startsWith('__reactFiber$'))!
    let fiber = (element as unknown as Record<string, Fiber>)[key]
    while (fiber && !fiber.ref?.current?.getMap) fiber = fiber.return!
    const map = fiber.ref!.current!.getMap!()
    const center = map.getCenter()
    const projected = map.project(center)
    const canvas = map.getCanvas().getBoundingClientRect()
    const stage = document.querySelector('[data-testid="voyage-globe-stage"]')?.getBoundingClientRect() ?? canvas
    const source = map.getStyle().sources['journey-arc'] as { data?: { geometry?: { coordinates?: number[][] } } } | undefined
    return { lng: center.lng, lat: center.lat, zoom: map.getZoom(), bearing: map.getBearing(), moving: map.isMoving(),
      canvas: { width: canvas.width, height: canvas.height },
      centerError: Math.hypot(canvas.x + projected.x - stage.x - stage.width / 2, canvas.y + projected.y - stage.y - stage.height / 2),
      route: source?.data?.geometry?.coordinates ?? [], vessel: window.__readPatrolVessel() }
  })
}

/** Observe a native 360° longitude orbit on the real browser clock. */
export async function nativeOrbitSamples(page: Page, durationMs: number, minimumTravel?: number) {
  return page.locator('.map-root').evaluate(async (element, { durationMs, minimumTravel }) => {
    type Fiber = { ref?: { current?: { getMap?: () => NativeMap } }; return?: Fiber }
    const key = Object.keys(element).find(key => key.startsWith('__reactFiber$'))!
    let fiber = (element as unknown as Record<string, Fiber>)[key]
    while (fiber && !fiber.ref?.current?.getMap) fiber = fiber.return!
    const map = fiber.ref!.current!.getMap!()
    const samples: { ms: number; lng: number; lat: number; bearing: number; moving: boolean; vesselCovered?: boolean; vesselOpacity?: number }[] = []
    const start = performance.now()
    let travel = 0
    await new Promise<void>((resolve, reject) => {
      const frame = (now: number) => {
        const elapsed = now - start
        if (!samples.length || elapsed - samples.at(-1)!.ms >= 100) {
          const center = map.getCenter()
          if (samples.length) travel += (center.lng - samples.at(-1)!.lng + 540) % 360 - 180
          const vessel = document.querySelector('[data-testid="patrol-vessel"]')
          samples.push({ ms: elapsed, lng: center.lng, lat: center.lat, bearing: map.getBearing(), moving: map.isMoving(),
            vesselCovered: vessel?.classList.contains('maplibregl-marker-covered'), vesselOpacity: vessel ? Number(getComputedStyle(vessel).opacity) : undefined })
        }
        if (minimumTravel && Math.abs(travel) >= minimumTravel) return resolve()
        if (elapsed >= durationMs) return minimumTravel ? reject(new Error(`Native orbit reached only ${travel.toFixed(1)}° in ${durationMs}ms`)) : resolve()
        requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })
    return samples
  }, { durationMs, minimumTravel })
}

export async function fullPatrolRecap(page: Page) {
  // Read fixed recap geometry atomically: serial scroll/read calls each wait for
  // another software-rendered globe frame and can outlast the behavior under test.
  const dom = await page.evaluate(() => {
    const rect = (element: Element) => {
      const box = element.getBoundingClientRect()
      return { x: box.x, y: box.y, width: box.width, height: box.height }
    }
    const recap = document.querySelector('[data-testid="patrol-recap"]')!
    const explore = document.querySelector('[data-testid="patrol-explore"]')!
    const map = document.querySelector('[data-testid="map"]')!
    const visible = (element: Element) => getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none' && element.getBoundingClientRect().height > 0
    return { phase: document.querySelector<HTMLElement>('.app')!.dataset.phase,
      stage: document.querySelector('[data-testid="patrol"]')!.getAttribute('data-patrol-stage'),
      visited: document.querySelectorAll('.voyage-stop-rail .is-visited').length,
      recapVisible: visible(recap), exploreVisible: visible(explore), explore: rect(explore),
      miles: document.querySelector('[data-testid="miles-value"]')!.textContent,
      progress: document.querySelector('.voyage-footer [role="progressbar"]')!.getAttribute('aria-valuenow'),
      globe: rect(document.querySelector('[data-testid="voyage-globe-stage"]')!),
      projection: map.getAttribute('data-projection'), worldCopies: map.getAttribute('data-world-copies'),
      canvases: document.querySelectorAll('.maplibregl-canvas').length,
      buttons: [...recap.querySelectorAll('button')].map(button => ({ id: button.dataset.testid, visible: visible(button), box: rect(button) })),
      noOverflow: document.documentElement.scrollWidth <= innerWidth + 1 }
  })
  expect(dom.phase).toBe('patrol')
  expect(dom.stage).toBe('recap')
  expect(dom.recapVisible).toBe(true)
  expect(dom.visited).toBe(9)
  const legs = buildPatrolLegs()
  const expectedPath = legs.flatMap((leg, index) => index === 0 ? leg.points : leg.points.slice(1))
  const state = await nativePatrolState(page)
  expect(state.route).toHaveLength(expectedPath.length)
  // V8 in Node and Chromium can differ in the last trig bit. Compare every
  // coordinate within sub-millimetre precision while requiring all1129 points.
  const maxCoordinateError = Math.max(...state.route.flatMap((point, index) => point.map((value, axis) => Math.abs(value - expectedPath[index][axis]))))
  expect(maxCoordinateError, 'The complete routed polyline remains drawn at100%').toBeLessThan(1e-9)
  assertPatrolVessel(state.vessel)
  const seattle = PATROL_STOPS.at(-1)!.lngLat
  expect(Math.abs((state.vessel.head![0] - seattle[0] + 540) % 360 - 180)).toBeLessThan(1e-8)
  expect(state.vessel.head![1]).toBeCloseTo(seattle[1], 8)
  expect(dom.miles?.trim()).toBe(Math.round(patrolMiles(legs)).toLocaleString('en-US'))
  expect(dom.progress).toBe('100')
  expect(dom.projection).toBe('vertical-perspective')
  expect(dom.worldCopies).toBe('false')
  expect(dom.canvases).toBe(1)
  assertStage(dom.globe, page.viewportSize()!)
  expect(dom.noOverflow).toBe(true)
  const inViewport = (box: StageBox) => {
    expect(box.x).toBeGreaterThanOrEqual(-1)
    expect(box.y).toBeGreaterThanOrEqual(-1)
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1)
  }
  expect(dom.exploreVisible).toBe(true)
  expect(dom.explore.width).toBeGreaterThanOrEqual(44)
  expect(dom.explore.height).toBeGreaterThanOrEqual(44)
  inViewport(dom.explore)
  expect(dom.buttons.map(button => button.id)).toEqual(PATROL_PORTS.map(id => `recap-port-${id}`))
  for (const button of dom.buttons) { expect(button.visible).toBe(true); inViewport(button.box) }
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
  await expect(page.getByTestId('patrol-vessel')).toHaveCount(0)
}
