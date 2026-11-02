import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { MapHandle } from '../MapView'
import { prefersReducedMotion } from '../../lib/motion'
import { boundsFor } from '../../lib/camera'
import { ACT1, CAPE_MAY } from '../../journey/constants'
import { ACT1_BEATS, fill, LABELS } from '../../journey/copy'
import { daysUntil, formatShort, gradDate, TRAINING_WEEKS } from '../../journey/dates'
import type { LngLat } from '../../journey/arc'
import { DaysCounter } from './DaysCounter'

interface Props {
  /** ISO ship date chosen on the landing. */
  shipDate: string
  map: MapHandle | null
  /** Fires once, after the act completes or is skipped (same contract as JourneyOverlay). */
  onDone: (opts: { skipped: boolean }) => void
}

interface Beat {
  text: string
  at: number
  hold: number
}

const CAPE_MAY_LNGLAT: LngLat = [CAPE_MAY.lng, CAPE_MAY.lat]
const CAPE_MAY_CAMERA = { zoom: 7.4, pitch: 48, bearing: -12 }

/** National framing (CONUS) the fly-in departs from. */
function nationalPoints(): LngLat[] {
  const b = boundsFor('conus') as [LngLat, LngLat]
  return [b[0], b[1]]
}

/**
 * Act 1 — "Report to Cape May". No hometown: the camera starts on the national
 * view and performs one slow cinematic flyTo into Training Center Cape May while
 * the days counter ticks today → ship date, then a Week 1 → Week 8 training bar
 * fills under the beats. One GSAP timeline is the master clock (same pattern as
 * JourneyOverlay); Esc quietly completes the act. Camera moves go through the
 * map handle — never GSAP.
 */
export function TrainingAct({ shipDate, map, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const reduced = prefersReducedMotion()
  const totalDays = useMemo(() => Math.max(0, daysUntil(shipDate)), [shipDate])
  const [days, setDays] = useState(totalDays)
  const [weeks, setWeeks] = useState<number | null>(null)

  const beats = useMemo<Beat[]>(() => {
    const vars = { shipDate: formatShort(shipDate), gradDate: formatShort(gradDate(shipDate)) }
    const t0 = 0.3
    const t1 = ACT1.countdown + 0.5 // countdown has landed on the ship date
    const tWeeks = t1 + 0.6
    const t2 = tWeeks + 1.0
    const t3 = tWeeks + ACT1.weeks * 0.55
    const t4 = tWeeks + ACT1.weeks + 0.1
    const end = t4 + ACT1.graduate
    const ats = [t0, t1, t2, t3, t4, end]
    return ACT1_BEATS.map((text, i) => ({ text: fill(text, vars), at: ats[i], hold: ats[i + 1] - ats[i] - 0.45 }))
  }, [shipDate])

  const finish = (skipped: boolean) => {
    if (done.current) return
    done.current = true
    onDoneRef.current({ skipped })
  }

  /* ---------- master timeline ---------- */
  useEffect(() => {
    if (!map || !root.current) return
    done.current = false
    map.setJourneyMarkers([
      {
        id: CAPE_MAY.id,
        lngLat: CAPE_MAY_LNGLAT,
        label: CAPE_MAY.name,
        sublabel: `${CAPE_MAY.city}, ${CAPE_MAY.stateCode} · ${LABELS.bootCamp}`,
        kind: 'bootcamp',
      },
    ])

    if (reduced) {
      map.flyToPlace(CAPE_MAY_LNGLAT, { ...CAPE_MAY_CAMERA, duration: 0 })
      return
    }

    // Depart from the national view, then one slow cinematic fly-in to Cape May.
    map.fitPoints(nationalPoints(), { duration: 0, pitch: 0, maxZoom: 5 })

    const beatEls = Array.from(root.current.querySelectorAll<HTMLElement>('[data-beat]'))
    const counterEl = root.current.querySelector<HTMLElement>('[data-counter]')
    const cd = { d: totalDays }
    const wk = { w: 0 }
    const tWeeks = ACT1.countdown + 0.5 + 0.6
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    // text beats
    beats.forEach((b, i) => {
      const el = beatEls[i]
      if (!el) return
      tl.fromTo(el, { opacity: 0, y: 22, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, b.at)
      tl.to(el, { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' }, b.at + Math.max(0.6, b.hold))
    })

    // counter appears, then the days tick down to the ship date
    if (counterEl) tl.fromTo(counterEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.4)
    tl.to(cd, { d: 0, duration: ACT1.countdown, ease: 'power3.inOut', onUpdate: () => setDays(Math.round(cd.d)) }, 0.6)

    // cinematic fly-in (starts during the countdown, lands as training begins)
    tl.call(() => map.flyToPlace(CAPE_MAY_LNGLAT, { ...CAPE_MAY_CAMERA, duration: ACT1.fly * 1000 }), [], 1.2)

    // Week 1 → Week 8
    tl.call(() => setWeeks(0), [], tWeeks - 0.05)
    tl.to(wk, { w: TRAINING_WEEKS, duration: ACT1.weeks, ease: 'power1.inOut', onUpdate: () => setWeeks(wk.w) }, tWeeks)

    // graduation hold → orders board
    tl.call(() => finish(false), [], tWeeks + ACT1.weeks + 0.1 + ACT1.graduate + 0.1)

    return () => {
      tl.kill()
      gsap.set([...beatEls, counterEl].filter(Boolean) as HTMLElement[], { clearProps: 'all' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, shipDate])

  /* ---------- Esc quietly completes the act ---------- */
  const skip = () => {
    if (done.current) return
    map?.stop()
    setDays(0)
    setWeeks(TRAINING_WEEKS)
    map?.flyToPlace(CAPE_MAY_LNGLAT, { ...CAPE_MAY_CAMERA, duration: 1200 })
    finish(true)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  return (
    <div className={`journey journey--act1 journey--training ${reduced ? 'is-static' : ''}`} ref={root} data-testid="journey-act1">
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
        <DaysCounter days={days} totalDays={totalDays} shipDate={shipDate} weeks={weeks} />
      </div>
    </div>
  )
}
