import { test, expect } from '@playwright/test'

const SHOTS = 'docs/screenshots'
const POLAR_STAR = 'USCGC Polar Star (WAGB-10)'

test.describe('Start Your Adventure — Polar Star phase', () => {
  test('pick a ship date → Act 1 countdown → slot board lands on Polar Star → ship intro → patrol → explore panel', async ({ page }) => {
    await page.goto('/')

    // Landing: mission mosaic + 8 ship-date cards (next Tuesdays ≥ 14 days out), first card autofocused
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pick your')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('basic training date')
    await expect(page.getByText('Independent educational demonstration')).toBeVisible()
    await expect(page.getByTestId('date-schedule-label')).toContainText('Demo schedule')
    await expect(page.locator('.mosaic-tile')).toHaveCount(4)
    const cards = page.getByTestId('date-card')
    await expect(cards).toHaveCount(8)
    await expect(cards.first()).toBeFocused()
    await expect(cards.first()).toHaveAttribute('aria-checked', 'true')
    const isos = await cards.evaluateAll((els) => els.map((el) => el.getAttribute('data-iso')))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const iso of isos) {
      const [y, m, d] = iso!.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      expect(date.getDay()).toBe(2) // Tuesday
      expect((date.getTime() - today.getTime()) / 86_400_000).toBeGreaterThanOrEqual(14)
    }
    // Native fallback is reachable
    await page.getByTestId('date-other').click()
    await expect(page.getByTestId('date-input')).toBeVisible()
    await page.waitForTimeout(1200) // entrance stagger
    await page.screenshot({ path: `${SHOTS}/07-start-adventure.png` })

    // Pick the first card → Begin
    await cards.first().click()
    await page.getByTestId('date-begin').click()
    const act1 = page.getByTestId('journey-act1')
    await expect(act1).toBeVisible()
    await expect(page.getByTestId('landing')).toBeHidden()
    await expect(page.getByTestId('journey-marker-bootcamp')).toBeAttached()

    // Days counter: "Ships in N days · Tue, Mon D", then the Week 1 → Week 8 bar
    const counter = page.getByTestId('days-counter')
    await expect(counter).toContainText('Ships in')
    await expect(page.getByTestId('ship-date')).toContainText('Tue,')
    await expect(act1).toContainText('Cape May')
    await page.waitForTimeout(4600) // countdown landed, training under way
    await expect(counter).toContainText('Week')
    await expect(counter).toContainText('Cape May')
    await page.screenshot({ path: `${SHOTS}/08-training-countdown.png` })

    // Skip → assignment slot board
    await page.keyboard.press('Escape')
    const slot = page.getByTestId('slot')
    await expect(slot).toBeVisible()
    await expect(slot).toContainText('Orders are in')
    await page.getByTestId('slot-spin').click()
    // The reel always lands on Polar Star (owner decision)
    const landed = page.getByTestId('slot-landed')
    await expect(landed).toBeVisible({ timeout: 8000 })
    await expect(landed).toContainText(POLAR_STAR)
    await expect(landed).toContainText('Seattle, WA')
    await page.screenshot({ path: `${SHOTS}/09-orders.png` })

    // Report aboard → Act 2 arc to Seattle
    await page.getByTestId('slot-report').click()
    await expect(page.getByTestId('journey-act2')).toBeVisible()
    await expect(page.getByTestId('miles-counter')).toContainText(POLAR_STAR)
    await page.keyboard.press('Escape')

    // Ship intro card
    const ship = page.getByTestId('ship-intro')
    await expect(ship).toBeVisible()
    await expect(ship).toContainText('USCGC Polar Star')
    await expect(ship).toContainText('Heavy Polar Icebreaker')
    await page.waitForTimeout(1700) // entrance reveal settles
    await page.screenshot({ path: `${SHOTS}/11-ship-intro.png` })

    // Set sail → patrol cinematic; Esc ends it quietly
    await page.getByTestId('ship-begin').click()
    const patrol = page.getByTestId('patrol')
    await expect(patrol).toBeVisible()
    await expect(patrol).toContainText('First patrol')
    await page.waitForTimeout(6500) // first leg underway
    await page.screenshot({ path: `${SHOTS}/12-patrol.png` })
    await page.keyboard.press('Escape')

    // Explore: station panel for Polar Star with the first-unit ribbon
    const panel = page.getByTestId('station-panel')
    await expect(panel).toBeVisible()
    await expect(page.getByTestId('panel-title')).toHaveText(POLAR_STAR)
    await expect(page.getByTestId('panel-ribbon')).toContainText('Your first unit')
    await expect(page.getByTestId('directory-toggle')).toBeVisible()
    await page.waitForTimeout(3000) // flyTo settle
    await page.screenshot({ path: `${SHOTS}/10-first-unit.png` })

    // Back to map → national view, HUD present; Restart → landing
    await page.getByTestId('back-to-map').click()
    await expect(panel).toBeHidden()
    await expect(page.getByTestId('jump-gulf')).toBeVisible()
    await page.getByTestId('restart-adventure').click()
    await expect(page.getByTestId('landing')).toBeVisible()
    await expect(page.getByTestId('date-card').first()).toBeFocused()
  })

  test('Enter on a focused date card begins; the board always lands on Polar Star, for any date', async ({ page }) => {
    for (const cardIndex of [0, 3]) {
      await page.goto('/')
      const cards = page.getByTestId('date-card')
      await expect(cards.first()).toBeFocused()
      if (cardIndex > 0) await cards.nth(cardIndex).click()
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('journey-act1')).toBeVisible()
      await expect(page.getByTestId('days-counter')).toContainText('Ships in')
      await expect(page.getByTestId('journey-act1')).toBeVisible()
      await page.keyboard.press('Escape')
      await page.getByTestId('slot-spin').click()
      const landed = page.getByTestId('slot-landed')
      await expect(landed).toBeVisible({ timeout: 8000 })
      await expect(landed).toContainText(POLAR_STAR)
    }
  })

  test('reduced motion: static beats, instant slot, port list + Continue', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByTestId('date-card').nth(1).click()
    await page.getByTestId('date-begin').click()
    const act1 = page.getByTestId('journey-act1')
    await expect(act1).toBeVisible()
    await expect(page.getByTestId('journey-beat')).toHaveCount(5)
    await expect(page.getByTestId('journey-beat').first()).toBeVisible()
    await expect(page.getByTestId('journey-beat').nth(4)).toContainText('Graduation:')
    await expect(page.getByTestId('days-value')).toContainText('Ships in')
    await page.getByTestId('journey-continue').click()

    // Slot lands instantly under reduced motion
    const landed = page.getByTestId('slot-landed')
    await expect(landed).toBeVisible()
    await expect(landed).toContainText(POLAR_STAR)
    await page.getByTestId('slot-report').click()
    await page.getByTestId('journey-continue').click()

    // Ship intro → patrol static list + Continue
    await page.getByTestId('ship-begin').click()
    const patrol = page.getByTestId('patrol')
    await expect(patrol).toBeVisible()
    await expect(patrol.locator('.patrol-static-list li')).toHaveCount(8)
    await page.getByTestId('journey-continue').click()
    await expect(page.getByTestId('panel-ribbon')).toBeVisible()
  })

  test('mobile: date cards, slot board, and port flow fit a phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const begin = page.getByTestId('date-begin')
    await begin.scrollIntoViewIfNeeded()
    const box = await begin.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    const last = page.getByTestId('date-card').last()
    const lb = await last.boundingBox()
    expect(lb!.x + lb!.width).toBeLessThanOrEqual(390)
    await page.getByTestId('date-card').nth(2).click()
    await begin.click()
    await expect(page.getByTestId('journey-act1')).toBeVisible()
    await page.keyboard.press('Escape')

    // Slot board fits
    const frame = page.locator('.slot-frame')
    await expect(frame).toBeVisible()
    const fb = await frame.boundingBox()
    expect(fb!.x).toBeGreaterThanOrEqual(0)
    expect(fb!.x + fb!.width).toBeLessThanOrEqual(390)
    await page.getByTestId('slot-spin').click()
    await expect(page.getByTestId('slot-landed')).toBeVisible({ timeout: 8000 })
    await page.getByTestId('slot-report').click()
    await page.keyboard.press('Escape') // skip act 2
    await expect(page.getByTestId('ship-intro')).toBeVisible()
    await page.getByTestId('ship-begin').click()
    await expect(page.getByTestId('patrol')).toBeVisible()
    await page.keyboard.press('Escape') // end patrol
    await expect(page.getByTestId('panel-ribbon')).toBeVisible()
    // HUD chips must not clip off the right edge on narrow widths
    const dir = await page.getByTestId('directory-toggle').boundingBox()
    expect(dir!.x + dir!.width).toBeLessThanOrEqual(390)
  })
})
