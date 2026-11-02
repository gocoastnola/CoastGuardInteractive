import { test, expect } from '@playwright/test'

const SHOTS = 'docs/screenshots'

test.describe('CoastGuard Interactive — smoke', () => {
  test('landing → explore → select unit → panel → Esc closes', async ({ page }) => {
    await page.goto('/')

    // Landing
    const landing = page.getByTestId('landing')
    await expect(landing).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pick your')
    await expect(page.getByText('Independent educational demonstration')).toBeVisible()
    await page.waitForTimeout(1500) // let GSAP entrance settle + basemap begin loading
    await page.screenshot({ path: `${SHOTS}/01-landing.png` })

    // Free explore (quiet secondary link) — no journey, straight to the national map
    await page.getByTestId('explore').click()
    await expect(landing).toBeHidden()
    await expect(page.getByTestId('directory-toggle')).toBeVisible()

    // Markers rendered
    const markers = page.getByTestId('marker')
    await expect(markers.first()).toBeAttached()
    expect(await markers.count()).toBeGreaterThanOrEqual(15)
    await page.waitForTimeout(3000) // national intro fly
    await page.screenshot({ path: `${SHOTS}/02-national-map.png` })

    // Zoom to the Gulf so nearby Louisiana markers no longer overlap, then hover a marker
    await page.getByTestId('jump-gulf').click()
    await page.waitForTimeout(2500)
    const grandIsle = page.locator('[data-unit-id="station-grand-isle"]')
    await grandIsle.hover()
    await expect(grandIsle.locator('.marker-tip')).toContainText('Station Grand Isle')

    // Click marker → panel with unit name
    await grandIsle.click()
    const panel = page.getByTestId('station-panel')
    await expect(panel).toBeVisible()
    await expect(page.getByTestId('panel-title')).toHaveText('Station Grand Isle')
    await expect(grandIsle).toHaveClass(/is-selected/)
    await page.waitForTimeout(3500) // flyTo settle
    await page.screenshot({ path: `${SHOTS}/03-station-panel.png` })

    // Narration tab shows transcript; play disabled until audio enabled
    await page.getByRole('tab', { name: 'Narration' }).click()
    await expect(page.getByTestId('transcript')).toContainText('Station Grand Isle')
    await expect(page.getByTestId('narration-play')).toBeDisabled()
    await page.getByTestId('enable-audio').click()
    await expect(page.getByTestId('narration-play')).toBeEnabled()
    await page.screenshot({ path: `${SHOTS}/04-narration.png` })

    // Esc closes
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()

    // Directory → select behaves like marker click
    await page.getByTestId('directory-toggle').click()
    const search = page.getByTestId('directory-search')
    await expect(search).toBeFocused()
    await search.fill('kodiak')
    const item = page.getByTestId('directory-item')
    await expect(item).toHaveCount(1)
    await item.click()
    await expect(page.getByTestId('panel-title')).toHaveText('Air Station Kodiak')
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${SHOTS}/05-directory-and-panel.png` })

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('station-panel')).toBeHidden()
  })

  test('mobile: panel becomes bottom sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByTestId('explore').click()
    await page.getByTestId('directory-toggle').click()
    await page.getByTestId('directory-search').fill('new orleans')
    await page.getByTestId('directory-item').first().click()
    const panel = page.getByTestId('station-panel')
    await expect(panel).toBeVisible()
    const box = await panel.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(380) // full-width sheet
    expect(box!.y).toBeGreaterThan(100) // anchored to bottom, not top
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${SHOTS}/06-mobile-sheet.png` })
  })
})
