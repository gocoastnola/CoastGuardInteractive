import { test, expect } from '@playwright/test'
import { attributionUsable, controlInViewport, deterministicMedia, globeStage, imageLoaded, noHorizontalOverflow, noOverlap, opaque, openLanding, patrolGeography, phase, reachShipBySkip, screenshot } from './helpers'
test.beforeEach(async ({ page }) => deterministicMedia(page))

test('free explore, directory, marker selection, narration gate and Escape', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openLanding(page)
  await page.getByTestId('explore').click()
  await phase(page, 'explore')
  await expect(page.getByTestId('marker')).toHaveCount(18)
  await page.getByTestId('jump-gulf').click()
  const grandIsle = page.locator('[data-unit-id="station-grand-isle"]')
  await grandIsle.focus()
  await expect(grandIsle).toBeFocused()
  await grandIsle.press('Enter')
  await expect(page.getByTestId('panel-title')).toHaveText('Station Grand Isle')
  await expect(grandIsle).toHaveClass(/is-selected/)
  await page.getByRole('tab', { name: 'Narration' }).click()
  await expect(page.getByTestId('transcript')).toContainText('Station Grand Isle')
  await expect(page.getByTestId('narration-play')).toBeDisabled()
  await page.getByTestId('enable-audio').click()
  await expect(page.getByTestId('narration-play')).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('station-panel')).toBeHidden()
  await page.getByTestId('directory-toggle').click()
  await page.getByTestId('directory-search').fill('guam')
  await page.getByTestId('directory-item').click()
  await expect(page.getByTestId('panel-title')).toHaveText('Sector Guam')
  // Native covered-class calculation excludes points projected offscreen.
  // Both kinds of invisible globe marker must leave the keyboard order.
  await expect.poll(() => grandIsle.evaluate(button => {
    const box = button.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2
    return x < 0 || y < 0 || x > innerWidth || y > innerHeight || Number(getComputedStyle(button).opacity) < 0.05
  })).toBe(true)
  await expect(grandIsle).toHaveAttribute('tabindex', '-1')
  await expect(grandIsle).toHaveAttribute('aria-hidden', 'true')
  await page.keyboard.press('Escape')
  // Desktop directory intentionally stays open after selecting a unit.
  await expect(page.getByTestId('directory')).toBeVisible()
  await page.getByTestId('directory-toggle').click()
  await expect(page.getByTestId('directory')).toHaveCount(0)
  await page.getByTestId('jump-gulf').click()
  await expect(grandIsle).not.toHaveClass(/maplibregl-marker-covered/)
  await expect.poll(() => grandIsle.evaluate(button => button.tabIndex)).toBe(0)
  await page.getByTestId('directory-toggle').click()
  await expect(page.getByTestId('directory-search')).toBeFocused()
  await page.getByTestId('directory-search').fill('kodiak')
  await expect(page.getByTestId('directory-item')).toHaveCount(1)
  await page.getByTestId('directory-item').click()
  await expect(page.getByTestId('panel-title')).toHaveText('Air Station Kodiak')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('station-panel')).toBeHidden()
})

for (const viewport of [{ width: 390, height: 664 }, { width: 360, height: 740 }, { width: 844, height: 390 }]) {
  test(`narrow/landscape controls remain usable — ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await openLanding(page)
    await noHorizontalOverflow(page)
    await controlInViewport(page, page.getByTestId('zip-input'))
    await controlInViewport(page, page.getByTestId('zip-begin'))
    await screenshot(page, testInfo, 'opening-layout')
    await reachShipBySkip(page)
    await noHorizontalOverflow(page)
    const shipTop = await page.locator('.ship-card').evaluate(card => card.getBoundingClientRect().top)
    expect(shipTop).toBeGreaterThanOrEqual(-1)
    await controlInViewport(page, page.getByTestId('ship-begin'))
    await screenshot(page, testInfo, 'ship-layout')
    await page.getByTestId('ship-begin').click()
    await phase(page, 'patrol')
    const firstPort = page.getByTestId('port-honolulu')
    await opaque(firstPort)
    const arrival = await patrolGeography(page, 'honolulu')
    noOverlap(arrival.card, arrival.heading, 'Port photography must not obscure the chapter heading')
    expect(arrival.card.y + arrival.card.height).toBeLessThanOrEqual(viewport.height)
    await screenshot(page, testInfo, 'port-layout')
    await page.keyboard.press('Escape')
    await phase(page, 'explore')
    await controlInViewport(page, page.getByTestId('directory-toggle'))
    const panel = page.getByTestId('station-panel')
    await expect(panel).toBeVisible()
    expect((await panel.boundingBox())!.width).toBeGreaterThan(viewport.width - 10)
    await screenshot(page, testInfo, 'mobile-sheet')
    await page.getByTestId('back-to-map').click()
    await expect(panel).toBeHidden()
    await attributionUsable(page)
  })
}

test('requested McMurdo gallery pauses the real voyage, scrolls, traps focus and resumes @production', async ({ page }, testInfo) => {
  test.setTimeout(65_000)
  await page.setViewportSize({ width: 390, height: 664 })
  await openLanding(page)
  await reachShipBySkip(page)
  await page.getByTestId('ship-begin').click()
  await phase(page, 'patrol')
  const card = page.getByTestId('port-mcmurdo')
  await opaque(card, 35_000)
  await globeStage(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const details = page.getByTestId('port-details-mcmurdo')
  await details.click()
  const dialog = page.getByTestId('voyage-details')
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog).toContainText(/research|science/i)
  await expect(page.getByTestId('gallery-close')).toBeFocused()
  const figures = page.getByTestId('gallery-grid').locator('figure')
  await expect(figures).toHaveCount(4)
  for (let i = 0; i < 4; i++) {
    await imageLoaded(figures.nth(i).locator('img'))
    await expect(figures.nth(i).locator('figcaption a')).toHaveAttribute('href', /^https:\/\//)
  }
  // Observe the genuine scene for longer than its authored2.4s hold.
  // This is a pause-duration assertion, not a sleep used to guess readiness;
  // the real clock and engine must remain paused on every observed frame.
  const miles = await page.getByTestId('miles-value').innerText()
  await page.evaluate(async () => {
    const card = document.querySelector('[data-testid="port-mcmurdo"]')!
    const miles = document.querySelector('[data-testid="miles-value"]')!.textContent
    const start = performance.now()
    let frames = 0
    await new Promise<void>((resolve, reject) => {
      const frame = () => {
        frames++
        if (card.getAttribute('aria-hidden') !== 'false' || document.querySelector('[data-testid="miles-value"]')!.textContent !== miles) return reject(new Error('Voyage progressed while requested gallery was open'))
        if (performance.now() - start >= 3100) {
          if (frames < 30) return reject(new Error('Too few rendered frames to verify gallery pause on this host'))
          return resolve()
        }
        requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })
  })
  await expect(card).toHaveAttribute('aria-hidden', 'false')
  await expect(page.getByTestId('miles-value')).toHaveText(miles)
  await expect(page.locator('.voyage-stop-rail [aria-current="step"]')).toContainText('McMurdo')
  const content = dialog.locator('.voyage-details-content')
  await content.hover()
  await page.mouse.wheel(0, 2000)
  await expect.poll(() => content.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  await figures.last().locator('figcaption a').scrollIntoViewIfNeeded()
  await expect(figures.last().locator('figcaption a')).toBeInViewport()
  const close = page.getByTestId('gallery-close')
  await close.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(figures.last().locator('figcaption a')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await screenshot(page, testInfo, 'requested-mcmurdo-gallery')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await phase(page, 'patrol')
  await expect(details).toBeFocused()
  await opaque(page.getByTestId('port-punta-arenas'), 20_000)
  await screenshot(page, testInfo, 'gallery-closed-voyage-resumed')
})
