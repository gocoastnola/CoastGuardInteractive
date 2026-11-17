import { test, expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { PATROL_STOPS } from '../src/journey/patrol'
import { attributionUsable, beginZip, controlInViewport, deterministicMedia, fullPatrolRecap, imageLoaded, nativeOrbitSamples, nativePatrolState, noHorizontalOverflow, opaque, openLanding, PATROL_PORTS, patrolGeography, phase, reachShipBySkip, screenshot } from './helpers'

test('user gesture initializes actual WebAudio; interruption does not create another context @production', async ({ page }) => {
  await deterministicMedia(page)
  await openLanding(page)
  expect(await page.evaluate(() => window.__audioContexts.length)).toBe(0)
  await beginZip(page)
  await expect.poll(() => page.evaluate(() => window.__audioContexts[0]?.state)).toBe('running')
  await page.keyboard.press('Escape')
  await phase(page, 'act1')
  await expect.poll(() => page.evaluate(() => window.__musicElements.length)).toBe(1)
  await expect.poll(() => page.evaluate(() => {
    const media = window.__musicElements[0]
    return !media.paused && !media.error && media.readyState >= 2
  })).toBe(true)
  const musicAt = await page.evaluate(() => window.__musicElements[0].currentTime)
  expect(musicAt).toBeGreaterThanOrEqual(45)
  await expect.poll(() => page.evaluate(() => window.__musicElements[0].currentTime)).toBeGreaterThan(musicAt + 0.05)
  await page.keyboard.press('Escape')
  await phase(page, 'orders')
  await page.evaluate(() => window.__audioContexts[0].suspend())
  expect(await page.evaluate(() => window.__audioContexts[0].state)).toBe('suspended')
  await page.getByTestId('slot-spin').click()
  await expect.poll(() => page.evaluate(() => window.__audioContexts[0].state)).toBe('running')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('slot-landed')).toContainText('Polar Star')
  expect(await page.evaluate(() => window.__audioContexts.length)).toBe(1)
  expect(await page.evaluate(() => window.__musicElements.length)).toBe(1)
  // Exercise a native end event without waiting for the complete recording.
  await page.evaluate(() => {
    const media = window.__musicElements[0]
    if (!Number.isFinite(media.duration) || media.duration <= 46) throw new Error('Recorded score metadata is unavailable')
    media.currentTime = media.duration - 0.15
  })
  await expect.poll(() => page.evaluate(() => window.__musicEndedCount)).toBeGreaterThan(0)
  await expect.poll(() => page.evaluate(() => {
    const media = window.__musicElements[0]
    return !media.paused && media.currentTime >= 45 && media.currentTime < 47
  })).toBe(true)
  expect(await page.evaluate(() => window.__musicElements.length)).toBe(1)
})

test('project subpath serves real ZIP data, bundled exterior media and map worker @production', async ({ page, request }) => {
  await deterministicMedia(page)
  const localFailures: string[] = []
  const workerResponses: string[] = []
  const musicResponses: string[] = []
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1') && response.status() >= 400) localFailures.push(response.url())
    if (response.url().includes('maplibre-gl-worker') && response.ok()) workerResponses.push(response.url())
    if (response.url().includes('/media/music/vanguard-scott-buckley.mp3') && response.ok()) musicResponses.push(response.url())
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
  await expect.poll(() => musicResponses.length).toBeGreaterThan(0)
  expect(musicResponses.every(url => new URL(url).pathname === `${basePath}media/music/vanguard-scott-buckley.mp3`)).toBe(true)
  expect(localFailures).toEqual([])
})

test('recorded-music outage preserves a real non-silent synthesized fallback @production', async ({ page }, testInfo) => {
  await deterministicMedia(page)
  let failedMusicRequests = 0
  await page.route('**/media/music/vanguard-scott-buckley.mp3', async route => {
    failedMusicRequests++
    await route.fulfill({ status: 503, body: 'Intentional recorded-music outage fixture' })
  })
  await openLanding(page)
  await beginZip(page)
  await page.keyboard.press('Escape')
  await phase(page, 'act1')
  await expect.poll(() => failedMusicRequests).toBeGreaterThan(0)
  // Tap the real master without replacing its destination or any instrument.
  // Wait past the ZIP arrival cue, then require new ongoing instruments plus
  // an actual non-silent waveform, rather than trusting a fallback flag.
  await page.evaluate(() => {
    const ctx = window.__audioContexts[0]
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    window.__masterGains[0].connect(analyser)
    Object.assign(window, { __fallbackProbe: { analyser, after: ctx.currentTime + 2 } })
  })
  try {
    await expect.poll(() => page.evaluate(async () => {
      const probe = (window as unknown as { __fallbackProbe: { analyser: AnalyserNode; after: number; samples?: unknown[] } }).__fallbackProbe
      const samples = new Float32Array(probe.analyser.fftSize)
      // The score has rhythmic rests: observe a real 500ms window instead of
      // letting one 42ms analyser slice happen to land in a rest on a busy host.
      const started = performance.now()
      let maxRms = 0
      await new Promise<void>(resolve => {
        const frame = () => {
          probe.analyser.getFloatTimeDomainData(samples)
          const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length)
          const currentTime = window.__audioContexts[0].currentTime
          if (currentTime >= probe.after) maxRms = Math.max(maxRms, rms)
          ;(probe.samples ??= []).push({ currentTime, after: probe.after, contextState: window.__audioContexts[0].state,
            totalInstruments: window.__oscillatorTimes.length,
            instrumentsAfterCue: window.__oscillatorTimes.filter(at => at >= probe.after).length,
            rms, maxRms, masterGain: window.__masterGains[0].gain.value,
            mediaError: window.__musicElements[0]?.error?.code, mediaPaused: window.__musicElements[0]?.paused })
          if (performance.now() - started >= 500) resolve()
          else requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
      })
      const instrumentsAfterCue = window.__oscillatorTimes.filter(at => at >= probe.after).length
      return window.__audioContexts[0].currentTime >= probe.after && instrumentsAfterCue >= 3 && maxRms > 0.01
    }), { timeout: 10_000 }).toBe(true)
  } finally {
    const samples = await page.evaluate(() => (window as unknown as { __fallbackProbe: { samples?: unknown[] } }).__fallbackProbe.samples)
    const probePath = testInfo.outputPath('actual-fallback-audio-probe.json')
    await writeFile(probePath, JSON.stringify(samples, null, 2))
    await testInfo.attach('actual-fallback-audio-probe', { path: probePath, contentType: 'application/json' })
  }
  expect(await page.evaluate(() => window.__audioContexts.length)).toBe(1)
  await expect(page.getByTestId('week-value')).toContainText(/Week|Graduated/)
})

test('native sphere and compact phone dock retain real Details and credit controls @production @webkit-globe', async ({ page }, testInfo) => {
  await deterministicMedia(page)
  await page.setViewportSize({ width: 390, height: 664 })
  await openLanding(page)
  await reachShipBySkip(page)
  await page.getByTestId('ship-begin').click()
  await phase(page, 'patrol')
  await opaque(page.getByTestId('port-honolulu'))
  await patrolGeography(page, 'honolulu')
  await page.getByTestId('port-details-honolulu').click()
  await expect(page.getByRole('dialog')).toContainText('Honolulu')
  await expect(page.getByTestId('gallery-close')).toBeFocused()
  const cameraGeometry = () => page.locator('.map-root').evaluate(element => {
    type LiveMap = { getCenter(): unknown; project(point: unknown): { x: number; y: number }; getCanvas(): HTMLCanvasElement; isMoving(): boolean }
    type Fiber = { ref?: { current?: { getMap?: () => LiveMap } }; return?: Fiber }
    const key = Object.keys(element).find(key => key.startsWith('__reactFiber$'))!
    let fiber = (element as unknown as Record<string, Fiber>)[key]
    while (fiber && !fiber.ref?.current?.getMap) fiber = fiber.return!
    const map = fiber.ref!.current!.getMap!()
    const stage = document.querySelector('[data-testid="voyage-globe-stage"]')!.getBoundingClientRect()
    const canvas = map.getCanvas().getBoundingClientRect()
    const center = map.project(map.getCenter())
    return { canvas: { width: canvas.width, height: canvas.height }, moving: map.isMoving(),
      centerError: Math.hypot(canvas.x + center.x - stage.x - stage.width / 2, canvas.y + center.y - stage.y - stage.height / 2) }
  })
  const rotate = async (size: { width: number; height: number }) => {
    await page.setViewportSize(size)
    await expect.poll(async () => {
      const geometry = await cameraGeometry()
      return geometry.canvas.width === size.width && geometry.canvas.height === size.height && geometry.centerError < 2
    }, { message: 'Rotation must reframe the native sphere inside the actual globe stage' }).toBe(true)
  }
  const pausedMiles = await page.getByTestId('miles-value').innerText()
  await rotate({ width: 844, height: 390 })
  expect((await cameraGeometry()).moving, 'Resizing an open gallery must leave the camera paused').toBe(false)
  await expect(page.getByTestId('miles-value')).toHaveText(pausedMiles)
  await rotate({ width: 390, height: 664 })
  await page.getByTestId('gallery-close').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await phase(page, 'patrol')
  await screenshot(page, testInfo, 'native-globe-phone-dock')
  await expect(page.locator('.voyage-leg-status')).toContainText('Hobart')
  await rotate({ width: 844, height: 390 })
  await screenshot(page, testInfo, 'native-globe-mid-leg-landscape')
  await rotate({ width: 390, height: 664 })
  await page.keyboard.press('Escape')
  await phase(page, 'explore')
  await page.getByTestId('back-to-map').click()
  await attributionUsable(page)
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

test('completed patrol rotates through every hemisphere, keeps all port galleries and exits on request @production', async ({ page }, testInfo) => {
  // Full authored patrol,360° native observation,9requested galleries and breakpoint reflows.
  test.setTimeout(130_000)
  await deterministicMedia(page)
  await page.setViewportSize({ width: 390, height: 664 })
  await openLanding(page)
  await reachShipBySkip(page)
  await page.getByTestId('ship-begin').click()
  await expect(page.getByTestId('patrol')).toHaveAttribute('data-patrol-stage', 'recap', { timeout: 50_000 })
  await fullPatrolRecap(page)
  await expect.poll(async () => Math.abs((await nativePatrolState(page)).lat + 20)).toBeLessThan(0.1)
  const samples = await nativeOrbitSamples(page, 18_000, 360)
  await testInfo.attach('actual-native-orbit-centers', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' })
  expect(samples.length, 'Observe native centers throughout the entire orbit').toBeGreaterThanOrEqual(24)
  const longitudeSteps = samples.slice(1).map((sample, index) => (sample.lng - samples[index].lng + 540) % 360 - 180)
  expect(Math.max(...longitudeSteps.map(Math.abs)), 'Native samples resolve the orbit continuously, within30°').toBeLessThan(30)
  const longitudeTravel = longitudeSteps.reduce((sum, step) => sum + step, 0)
  expect(Math.abs(longitudeTravel), 'The sphere turns through 360° of native longitude, beyond the American route').toBeGreaterThan(350)
  const quadrants = new Set(samples.map(sample => Math.floor(((sample.lng % 360 + 360) % 360) / 90)))
  expect([...quadrants].sort()).toEqual([0, 1, 2, 3])
  const bearings = samples.map(sample => sample.bearing)
  expect(Math.max(...bearings) - Math.min(...bearings), 'The orbit changes native longitude while keeping camera bearing steady').toBeLessThan(0.1)
  await phase(page, 'patrol')
  await fullPatrolRecap(page)
  await screenshot(page, testInfo, 'completed-patrol-stays-in-overview')

  for (const id of PATROL_PORTS) {
    const trigger = page.getByTestId(`recap-port-${id}`)
    const expectedName = PATROL_STOPS.find(stop => stop.id === id)!.name
    await trigger.click()
    const dialog = page.getByTestId('voyage-details')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(expectedName)
    await expect(page.getByTestId('gallery-close')).toBeFocused()
    const photos = page.getByTestId('gallery-grid').locator('figure')
    await expect(photos).toHaveCount(id === 'mcmurdo' ? 4 : 1)
    await imageLoaded(photos.first().locator('img'))
    if (id === 'mcmurdo') {
      const paused = await nativePatrolState(page)
      const pausedSamples = await nativeOrbitSamples(page, 1800)
      expect(pausedSamples.every(sample => Math.abs(sample.lng - paused.lng) < 1e-6 && Math.abs(sample.lat - paused.lat) < 1e-6 && !sample.moving), 'Opening any recap gallery pauses the actual native orbit').toBe(true)
      await page.setViewportSize({ width: 932, height: 430 })
      await expect.poll(async () => {
        const state = await nativePatrolState(page)
        return state.canvas.width === 932 && state.canvas.height === 430 && state.centerError < 2 && !state.moving
      }).toBe(true)
      await fullPatrolRecap(page)
      await noHorizontalOverflow(page)
      await screenshot(page, testInfo, 'recap-gallery-landscape-paused')
      await page.setViewportSize({ width: 390, height: 664 })
      await expect.poll(async () => {
        const state = await nativePatrolState(page)
        return state.canvas.width === 390 && state.canvas.height === 664 && state.centerError < 2 && !state.moving
      }).toBe(true)
      await fullPatrolRecap(page)
      await page.keyboard.press('Escape')
    } else await page.getByTestId('gallery-close').click()
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await phase(page, 'patrol')
  }
  const resumed = await nativePatrolState(page)
  await expect.poll(async () => Math.abs((await nativePatrolState(page)).lng - resumed.lng), { message: 'The completed route resumes native rotation after closing details' }).toBeGreaterThan(3)
  await page.setViewportSize({ width: 932, height: 430 })
  await expect.poll(async () => {
    const state = await nativePatrolState(page)
    return state.canvas.width === 932 && state.canvas.height === 430 && state.centerError < 2
  }).toBe(true)
  await fullPatrolRecap(page)
  await screenshot(page, testInfo, 'completed-patrol-landscape-rotating')
  await page.keyboard.press('Escape')
  await phase(page, 'explore')
  await expect(page.getByTestId('patrol')).toHaveCount(0)
  await expect(page.getByTestId('panel-ribbon')).toContainText('Your first unit')
  await page.getByTestId('back-to-map').click()
  await expect.poll(async () => (await nativePatrolState(page)).moving).toBe(false)
  const exited = await nativePatrolState(page)
  const exitedSamples = await nativeOrbitSamples(page, 1000)
  expect(exitedSamples.every(sample => Math.abs(sample.lng - exited.lng) < 1e-6 && !sample.moving), 'Exiting clears the recurring overview animation').toBe(true)
})
