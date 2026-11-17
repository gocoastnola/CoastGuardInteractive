import { describe, expect, it } from 'vitest'
import { globeOverviewZoom, nextPatrolOverviewCenter, PATROL_OVERVIEW_LATITUDE, startPatrolOverviewCamera, voyageMidpoint } from './globe'
import type { CameraOptions, EaseToOptions } from 'maplibre-gl'
import { haversineMiles } from '../journey/arc'
import { buildPatrolLegs } from '../journey/patrol'

describe('single-globe voyage framing', () => {
  it('crosses the antimeridian toward the Pacific rather than Greenwich', () => {
    const center = voyageMidpoint([[179, 0], [-179, 0]])
    expect(Math.abs(center[0])).toBeCloseTo(180, 5)
    expect(center[1]).toBeCloseTo(0, 5)
  })

  it('follows the intentional sea waypoints instead of shortcutting the endpoints', () => {
    const center = voyageMidpoint([[0, 0], [60, 0], [60, 60]])
    expect(center[0]).toBeCloseTo(60, 5)
    expect(center[1]).toBeCloseTo(0, 5)
  })

  it('handles stationary and singleton legs without invalid camera coordinates', () => {
    expect(voyageMidpoint([[-122, 47]])).toEqual([-122, 47])
    expect(voyageMidpoint([[-122, 47], [-122, 47]])).toEqual([-122, 47])
    expect(voyageMidpoint([]).every(Number.isFinite)).toBe(true)
  })

  it('compensates polar camera zoom to keep the same physical globe diameter', () => {
    const equatorial = globeOverviewZoom(350, 664, 0)
    const polar = globeOverviewZoom(350, 664, -60)
    expect(equatorial - polar).toBeCloseTo(1, 5)
    expect(globeOverviewZoom(350, 664, 60)).toBeCloseTo(polar, 5)
    expect(globeOverviewZoom(350, 664, -90)).toBeGreaterThanOrEqual(-2)
  })

  it('keeps each existing sea leg on the front hemisphere of its broad camera', () => {
    // At the widest supported whole-orb framing the native horizon is over 73°
    // from its center. Leave a margin for the current vessel and arrival label.
    const seventyDegreesInMiles = 3958.7613 * 70 * Math.PI / 180
    for (const leg of buildPatrolLegs()) {
      const center = voyageMidpoint(leg.points)
      for (const point of leg.points) {
        expect(haversineMiles(center, point), leg.to.name).toBeLessThan(seventyDegreesInMiles)
      }
    }
  })
})

// This harness checks event ownership, not MapLibre's projection or interpolation.
// The browser checks exercise these same camera commands against the native map.
function overviewCamera(longitude = -122.3) {
  let center = { lng: longitude, lat: 47.6 }
  const listeners = new Map<string, Set<(event: { originalEvent?: Event }) => void>>()
  const moves: EaseToOptions[] = []
  const jumps: CameraOptions[] = []
  const setCenter = (position: CameraOptions['center']) => {
    if (Array.isArray(position)) center = { lng: position[0], lat: position[1] }
  }
  const emit = (type: string, event: { originalEvent?: Event } = {}) => {
    for (const listener of [...(listeners.get(type) ?? [])]) listener(event)
  }
  const map = {
    getCenter: () => center,
    jumpTo: (options: CameraOptions) => { jumps.push(options); setCenter(options.center) },
    easeTo: (options: EaseToOptions) => { moves.push(options) },
    on: (type: string, listener: (event: { originalEvent?: Event }) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(listener)
    },
    off: (type: string, listener: (event: { originalEvent?: Event }) => void) => {
      listeners.get(type)?.delete(listener)
    },
  }
  return {
    map: map as unknown as Parameters<typeof startPatrolOverviewCamera>[0],
    moves,
    jumps,
    listeners,
    emit,
    setCenter,
    finish: () => { setCenter(moves.at(-1)?.center); emit('moveend') },
    listenerCount: () => [...listeners.values()].reduce((total, values) => total + values.size, 0),
  }
}

describe('native completed-patrol overview orchestration', () => {
  const frame = { zoom: -0.3, padding: { top: 80, right: 24, bottom: 200, left: 24 } }

  it('visits every longitude quadrant without a zero-length full-turn target', () => {
    for (const start of [-180, -122.3, 0, 179.9]) {
      let longitude = start
      let swept = 0
      for (let step = 0; step < 4; step++) {
        const next = nextPatrolOverviewCenter(longitude)
        const delta = ((next[0] - longitude + 180) % 360 + 360) % 360 - 180
        expect(delta).toBeCloseTo(90, 8)
        expect(next[1]).toBe(PATROL_OVERVIEW_LATITUDE)
        expect(next[0]).toBeGreaterThanOrEqual(-180)
        expect(next[0]).toBeLessThan(180)
        swept += delta
        longitude = next[0]
      }
      expect(swept).toBeCloseTo(360, 8)
      expect(longitude).toBeCloseTo(start, 8)
    }
  })

  it('gently centers at the current longitude, then continuously advances native linear segments', () => {
    const camera = overviewCamera()
    const cancel = startPatrolOverviewCamera(camera.map, frame)
    expect(camera.moves[0]).toMatchObject({ center: [-122.3, -20], duration: 1000, bearing: -18, pitch: 0, ...frame })
    expect(camera.jumps).toHaveLength(0)
    camera.emit('movestart') // The camera's own events must not cancel its continuation.
    for (let step = 0; step < 8; step++) {
      camera.finish()
      const move = camera.moves.at(-1)!
      expect(move.duration).toBe(3000)
      expect(move.bearing).toBe(-18)
      expect(move.pitch).toBe(0)
      expect(move.easing?.(0.35)).toBe(0.35)
      expect(camera.listeners.get('moveend')?.size).toBe(1)
    }
    expect(camera.moves).toHaveLength(9)
    cancel()
    expect(camera.listenerCount()).toBe(0)
  })

  it('removes the pending continuation before stop events and ignores stale listener delivery', () => {
    const camera = overviewCamera()
    const cancel = startPatrolOverviewCamera(camera.map, frame)
    const queued = [...camera.listeners.get('moveend')!][0]
    cancel()
    cancel()
    camera.emit('moveend') // Native stop() emits this event.
    queued({}) // A callback already being dispatched also respects cancellation.
    expect(camera.moves).toHaveLength(1)
    expect(camera.listenerCount()).toBe(0)
  })

  it('reflows immediately and resumes from the interrupted longitude with one continuation', () => {
    const camera = overviewCamera()
    const cancel = startPatrolOverviewCamera(camera.map, frame)
    camera.setCenter([-75, -20])
    cancel()
    camera.emit('moveend')
    const rotatedFrame = { zoom: -0.8, padding: { top: 10, right: 90, bottom: 10, left: 120 } }
    const cancelReflow = startPatrolOverviewCamera(camera.map, rotatedFrame, { reflow: true })
    expect(camera.jumps.at(-1)).toMatchObject({ center: [-75, -20], ...rotatedFrame })
    expect(camera.moves.at(-1)).toMatchObject({ center: [15, -20], duration: 3000, ...rotatedFrame })
    expect(camera.listeners.get('moveend')?.size).toBe(1)
    cancelReflow()
    expect(camera.listenerCount()).toBe(0)
  })

  it('keeps reduced motion static without camera continuations', () => {
    const camera = overviewCamera(165)
    const cancel = startPatrolOverviewCamera(camera.map, frame, { reducedMotion: true })
    expect(camera.jumps).toEqual([{ ...frame, center: [165, -20], bearing: -18, pitch: 0 }])
    expect(camera.moves).toHaveLength(0)
    expect(camera.listenerCount()).toBe(0)
    camera.emit('moveend')
    expect(camera.moves).toHaveLength(0)
    cancel()
  })

  it('fits a paused recap to new framing without resuming its rotation', () => {
    const camera = overviewCamera(38)
    const cancel = startPatrolOverviewCamera(camera.map, frame, { reflow: true, paused: true })
    expect(camera.jumps).toEqual([{ ...frame, center: [38, -20], bearing: -18, pitch: 0 }])
    camera.emit('moveend')
    expect(camera.moves).toHaveLength(0)
    expect(camera.listenerCount()).toBe(0)
    cancel()
  })

  it.each(['mousedown', 'touchstart', 'wheel', 'movestart'])('yields to native user %s without restarting at moveend', (type) => {
    const camera = overviewCamera()
    startPatrolOverviewCamera(camera.map, frame)
    camera.emit(type, { originalEvent: new Event(type) })
    camera.emit('moveend')
    expect(camera.moves).toHaveLength(1)
    expect(camera.listenerCount()).toBe(0)
  })
})
