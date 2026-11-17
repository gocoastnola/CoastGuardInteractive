import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import gsap from 'gsap'
import { SlotMachine } from './SlotMachine'
import { UNITS } from '../../lib/units'
import { sound } from '../../lib/audio'

const ownedTween = vi.hoisted(() => ({ kill: vi.fn() }))
vi.mock('gsap', () => ({ default: {
  context: vi.fn(() => ({ revert: vi.fn() })),
  to: vi.fn(() => ownedTween),
} }))
vi.mock('../../lib/audio', () => ({ sound: {
  enable: vi.fn(), ambient: vi.fn(), whoosh: vi.fn(), slotSpin: vi.fn(),
  tick: vi.fn(), lock: vi.fn(), horn: vi.fn(),
} }))

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.useRealTimers())

describe('assignment animation lifecycle', () => {
  it('Escape cancels the owned reel tween and resolves the board without global cancellation', () => {
    render(<SlotMachine units={UNITS} onReport={() => {}} />)
    fireEvent.click(screen.getByTestId('slot-spin'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(ownedTween.kill).toHaveBeenCalledOnce()
    expect(screen.getByTestId('slot-final')).toHaveTextContent('USCGC Polar Star')
  })

  it('unmount cancels the reel and its pending horn so a departed scene cannot play it later', () => {
    vi.useFakeTimers()
    const { unmount } = render(<SlotMachine units={UNITS} onReport={() => {}} />)
    fireEvent.click(screen.getByTestId('slot-spin'))
    const options = vi.mocked(gsap.to).mock.calls[0][1] as { onComplete: () => void }
    act(() => options.onComplete())
    expect(sound.lock).toHaveBeenCalledOnce()
    unmount()
    act(() => vi.runAllTimers())
    expect(ownedTween.kill).toHaveBeenCalledOnce()
    expect(sound.horn).not.toHaveBeenCalled()
  })
})
