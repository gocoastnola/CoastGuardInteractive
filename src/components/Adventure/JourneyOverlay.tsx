import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { MapHandle, JourneyMarker } from '../MapView'
import { prefersReducedMotion } from '../../lib/motion'
import { formatMiles, greatCircleArc, haversineMiles, type LngLat } from '../../journey/arc'
import { ACT1_ARC as ACT1, ACT2, ARC_SAMPLES } from '../../journey/constants'
import { ACT1_ZIP_BEATS as ACT1_BEATS, ACT2_BEATS, fill, LABELS } from '../../journey/copy'
import { MilesCounter } from './MilesCounter'

export interface Leg {
  from: LngLat
  to: LngLat
  /** Short name of the destination for the counter ("Cape May", unit name). */
  toShort: string
  /** Name used inside beat copy `{unit}`. */
  toName: string
  markers: JourneyMarker[]
}

interface Props {
  act: 1 | 2
  leg: Leg
  map: MapHandle | null
  /** Fires once, after the act completes or is skipped. */
  onDone: (opts: { skipped: boolean }) => void
}

interface Beat {
  text: string
  at: number
  hold: number
}

/** Keeps the arc clear of the beat text (top) and the miles counter (bottom). */
function framePadding(staticBeats = false) {
  const narrow = window.innerWidth <= 860
  if (staticBeats) return narrow ? { top: 300, bottom: 140, left: 60, right: 60 } : { top: 360, bottom: 190, left: 160, right: 160 }
  return narrow
    ? { top: 180, bottom: 150, left: 84, right: 84 }
    : { top: 220, bottom: 190, left: 120, right: 120 }
}

/**
 * Cinematic arc act: frames both points, draws the great-circle arc with a travelling
 * head, ticks the miles counter, and plays timed text beats. Used for Act 2
 * (Cape May → first unit). The `act === 1` branch is the legacy hometown arc
 * (ZIP landing, retained but unused — the live Act 1 is TrainingAct.tsx). One GSAP timeline is
 * the master clock (its ticker is requestAnimationFrame-driven), so Skip/Esc can
 * tear everything down in one call. Camera moves go through MapLibre via the map
 * handle — never GSAP (see AGENTS.md).
 */
export function JourneyOverlay({ act, leg, map, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const reduced = prefersReducedMotion()
  const points = useMemo(() => greatCircleArc(leg.from, leg.to, ARC_SAMPLES), [leg.from, leg.to])
  const total = useMemo(() => haversineMiles(leg.from, leg.to), [leg.from, leg.to])
  const [miles, setMiles] = useState(reduced ? total : 0)

  const beats = useMemo<Beat[]>(() => {
    const vars = { miles: formatMiles(total), unit: leg.toName }
    if (act === 1) {
      const t0 = 0.3
      const t1 = ACT1.frameBoth + 0.4
      const t2 = ACT1.frameBoth + ACT1.arc * 0.55
      const t3 = ACT1.frameBoth + ACT1.arc + 0.3
      const t4 = ACT1.frameBoth + ACT1.arc + ACT1.arrive + 0.1
      const end = t4 + ACT1.graduate
      const ats = [t0, t1, t2, t3, t4, end]
      return ACT1_BEATS.map((text, i) => ({ text: fill(text, vars), at: ats[i], hold: ats[i + 1] - ats[i] - 0.45 }))
    }
    const t0 = 0.2
    const t1 = ACT2.frameBoth + 0.4
    const t2 = ACT2.frameBoth + ACT2.arc + 0.2
    const end = t2 + 1.4
    const ats = [t0, t1, t2, end]
    return ACT2_BEATS.map((text, i) => ({ text: fill(text, vars), at: ats[i], hold: ats[i + 1] - ats[i] - 0.45 }))
  }, [act, total, leg.toName])

  const finish = (skipped: boolean) => {
    if (done.current) return
    done.current = true
    onDoneRef.current({ skipped })
  }

  /* ---------- master timeline ---------- */
  useEffect(() => {
    if (!map || !root.current) return
    done.current = false
    map.setJourneyMarkers(leg.markers)
    const T = act === 1 ? ACT1 : ACT2

    if (reduced) {
      map.fitPoints(points, { duration: 0, pitch: 0, padding: framePadding(true) })
      map.drawArc(points, 1)
      return
    }

    map.drawArc(points, 0)
    map.fitPoints(points, { duration: T.frameBoth * 1000, pitch: 0, maxZoom: 7.5, padding: framePadding() })

    const beatEls = Array.from(root.current.querySelectorAll<HTMLElement>('[data-beat]'))
    const counterEl = root.current.querySelector<HTMLElement>('[data-counter]')
    const proxy = { p: 0 }
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    // text beats
    beats.forEach((b, i) => {
      const el = beatEls[i]
      if (!el) return
      tl.fromTo(el, { opacity: 0, y: 22, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, b.at)
      tl.to(el, { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' }, b.at + Math.max(0.6, b.hold))
    })

    // counter appears with the arc
    if (counterEl) tl.fromTo(counterEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, T.frameBoth)

    // arc + miles
    tl.to(
      proxy,
      {
        p: 1,
        duration: T.arc,
        ease: 'power1.inOut',
        onUpdate: () => {
          map.drawArc(points, proxy.p)
          setMiles(total * proxy.p)
        },
      },
      T.frameBoth,
    )

    // camera drifts along with the head (single long ease, no per-frame fighting)
    tl.call(
      () => {
        const m = map.getMap()
        if (!m) return
        // Gentle: a touch of zoom + pitch only (centre stays put) so both labels remain in frame.
        map.easeTo({
          zoom: m.getZoom() + (window.innerWidth <= 860 ? 0.04 : 0.12),
          pitch: 26,
          bearing: -4,
          duration: T.arc * 1000 * 0.92,
        })
      },
      [],
      T.frameBoth + 0.25,
    )

    // arrival
    if (act === 1) {
      tl.call(() => map.flyToPlace(leg.to, { zoom: 7.4, pitch: 48, bearing: -12, duration: ACT1.arrive * 1000 }), [], T.frameBoth + T.arc)
      tl.call(() => finish(false), [], T.frameBoth + T.arc + ACT1.arrive + ACT1.graduate + 0.1)
    } else {
      // Act 2 hands the final fly-in to the station selection (same camera as a marker click)
      tl.call(() => finish(false), [], T.frameBoth + T.arc + 0.8)
    }

    return () => {
      tl.kill()
      gsap.set([...beatEls, counterEl].filter(Boolean) as HTMLElement[], { clearProps: 'all' })
      // The finished arc stays on the map (orders scene / next act replaces it); App clears it on explore/restart.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, act, leg])

  /* ---------- skip (button / Esc) ---------- */
  const skip = () => {
    if (done.current) return
    map?.stop()
    map?.drawArc(points, 1)
    setMiles(total)
    if (act === 1) map?.flyToPlace(leg.to, { zoom: 7.4, pitch: 48, bearing: -12, duration: 1200 })
    finish(true)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points])

  return (
    <div className={`journey journey--act${act} ${reduced ? 'is-static' : ''}`} ref={root} data-testid={`journey-act${act}`}>
      <div className="journey-beats" aria-live="polite">
        {beats.map((b, i) => (
          <p key={i} className="journey-beat" data-beat data-testid="journey-beat">
            {b.text}
          </p>
        ))}
        {reduced && (
          <button className="btn btn-primary journey-continue" onClick={() => finish(false)} data-testid="journey-continue">
            {LABELS.continue} <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      <div className="journey-counter" data-counter>
        <MilesCounter miles={miles} total={total} place={leg.toShort} />
      </div>
    </div>
  )
}
