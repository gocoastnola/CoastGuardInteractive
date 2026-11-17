import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MapHandle } from '../MapView'
import { TrainingAct } from './TrainingAct'
import { PatrolOverlay } from './PatrolOverlay'
import { MilesCounter } from './MilesCounter'
import { sound } from '../../lib/audio'

function reduceMotion() {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: true, media: query }) as MediaQueryList)
}

afterEach(() => vi.restoreAllMocks())

describe('reduced-motion story recovery', () => {
  it('retains every training week, original training photographs and graduation before Continue', () => {
    reduceMotion()
    const onDone = vi.fn()
    const map = { setJourneyMarkers: vi.fn(), flyToPlace: vi.fn(), stop: vi.fn() } as unknown as MapHandle
    render(<TrainingAct shipDate="2026-11-17" map={map} onDone={onDone} />)
    expect(screen.getAllByTestId('training-week').map((week) => week.textContent)).toEqual([
      'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8',
    ])
    expect(screen.getAllByRole('img')).toHaveLength(6)
    expect(screen.getByAltText(/confidence course/)).toHaveAttribute('src', expect.stringContaining('/1312/1121174/'))
    expect(screen.getByTestId('training-graduation')).toHaveTextContent('Graduation')
    expect(screen.getByTestId('week-value')).toHaveTextContent('Graduated')
    expect(screen.getAllByRole('link', { name: 'USCG photo · source' })).toHaveLength(6)
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('journey-continue'))
    expect(onDone).toHaveBeenCalledExactlyOnceWith({ skipped: false })
  })

  it('stops its ambient bed when the static patrol is unmounted', () => {
    reduceMotion()
    const enable = vi.spyOn(sound, 'enable').mockImplementation(() => {})
    const ambient = vi.spyOn(sound, 'ambient').mockImplementation(() => {})
    const stopAmbient = vi.spyOn(sound, 'stopAmbient').mockImplementation(() => {})
    const setPadding = vi.fn()
    const map = { setJourneyMarkers: vi.fn(), setPatrolVessel: vi.fn(), fitPoints: vi.fn(), frameVoyageLeg: vi.fn(), drawArc: vi.fn(), stop: vi.fn(), getMap: vi.fn(() => ({ setPadding })) } as unknown as MapHandle
    const { unmount } = render(<PatrolOverlay map={map} onDone={() => {}} />)
    expect(enable).toHaveBeenCalledOnce()
    expect(ambient).toHaveBeenCalledOnce()
    expect(map.setPatrolVessel).toHaveBeenCalledExactlyOnceWith(true)
    const itinerary = screen.getByRole('list', { name: 'Complete voyage itinerary' })
    expect(within(itinerary).getAllByRole('listitem')).toHaveLength(9)
    expect(itinerary.textContent!.indexOf('McMurdo')).toBeLessThan(itinerary.textContent!.indexOf('Patagonia'))
    unmount()
    expect(map.setPatrolVessel).toHaveBeenLastCalledWith(false)
    expect(map.stop).toHaveBeenCalledOnce()
    expect(setPadding).toHaveBeenCalledWith({ top: 0, bottom: 0, left: 0, right: 0 })
    expect(stopAmbient).toHaveBeenCalledOnce()
  })
})

describe('distance readouts', () => {
  it('identifies hometown distances as approximate straight-line measurements', () => {
    render(<MilesCounter miles={100} total={200} place="Cape May" />)
    expect(screen.getByTestId('miles-counter')).toHaveTextContent('miles to Cape May')
    expect(screen.getByTestId('miles-note')).toHaveTextContent('Approximate straight-line distance')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('labels the patrol as an approximate cumulative sea route rather than miles to patrol miles', () => {
    render(<MilesCounter miles={100} total={200} place="patrol miles" cumulative />)
    expect(screen.getByTestId('miles-counter')).toHaveTextContent('approx. patrol miles')
    expect(screen.getByTestId('miles-counter')).not.toHaveTextContent('miles to patrol miles')
    expect(screen.getByTestId('miles-note')).toHaveTextContent('Approximate cumulative sea route')
  })
})
