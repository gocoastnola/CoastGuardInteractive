import { SafeImage } from '../SafeImage'
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
  /** Internal narrative start date (the ZIP-first landing does not ask for a date). */
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

const TRAINING_PHOTOS = [
  { src: 'https://commons.wikimedia.org/wiki/Special:FilePath/U.S._Coast_Guard_recruits_assigned_to_Company_Quebec_188_march_during_Cadence_Contest_2013_at_Training_Center_Cape_May_in_Cape_May%2C_N.J.%2C_Sept_130906-G-WA946-323.jpg?width=1200', caption: 'FORMATION • TEAMWORK', alt: 'Coast Guard recruits marching in formation at Cape May', source: 'https://commons.wikimedia.org/wiki/File:U.S._Coast_Guard_recruits_assigned_to_Company_Quebec_188_march_during_Cadence_Contest_2013_at_Training_Center_Cape_May_in_Cape_May%2C_N.J.%2C_Sept_130906-G-WA946-323.jpg' },
  { src: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2307/7912769/1000w_q95.jpg', caption: 'WATER SURVIVAL • CONFIDENCE', alt: 'Coast Guard recruits practicing survival skills in the Cape May pool', source: 'https://www.dvidshub.net/image/7912769' },
  { src: 'https://commons.wikimedia.org/wiki/Special:FilePath/U.S._Coast_Guard_recruits_use_pugil_sticks_during_training_at_Coast_Guard_Training_Center_Cape_May_in_Cape_May%2C_N.J.%2C_Aug._1%2C_2013_130801-G-WA946-704.jpg?width=1200', caption: 'PUGIL STICKS • COURAGE', alt: 'Coast Guard recruits competing with padded pugil sticks', source: 'https://commons.wikimedia.org/wiki/File:U.S._Coast_Guard_recruits_use_pugil_sticks_during_training_at_Coast_Guard_Training_Center_Cape_May_in_Cape_May%2C_N.J.%2C_Aug._1%2C_2013_130801-G-WA946-704.jpg' },
  { src: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/1312/1121174/1000w_q95.jpg', caption: 'CONFIDENCE COURSE • GRIT', alt: 'Coast Guard recruits tackling the Cape May confidence course', source: 'https://www.dvidshub.net/image/1121174' },
  { src: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2609/9939059/1000w_q95.jpg', caption: 'WEEK EIGHT • YOU MADE IT', alt: 'Coast Guard Cape May recruits raising their hands during graduation ceremony', source: 'https://www.dvidshub.net/image/9939059' },
  { src: 'https://d1ldvf68ux039x.cloudfront.net/thumbs/photos/2609/9939061/1000w_q95.jpg', caption: 'GRADUATION • SEMPER PARATUS', alt: 'Coast Guard recruits graduate from Training Center Cape May and prepare to receive orders', source: 'https://www.dvidshub.net/image/9939061' },
] as const

const CAPE_MAY_LNGLAT: LngLat = [CAPE_MAY.lng, CAPE_MAY.lat]
const CAPE_MAY_CAMERA = { zoom: 7.4, pitch: 48, bearing: -12 }

/** National framing (CONUS) the fly-in departs from. */
function nationalPoints(): LngLat[] {
  const b = boundsFor('conus') as [LngLat, LngLat]
  return [b[0], b[1]]
}

/**
 * Boot camp follows the hometown-to-Cape-May travel scene. The existing fly-in
 * and Week 1 → Week 8 progression share one GSAP timeline (same pattern as
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
  const [weeks, setWeeks] = useState<number | null>(reduced ? TRAINING_WEEKS : null)

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

  const photoIndex = weeks === null ? -1 : Math.min(TRAINING_PHOTOS.length - 1, Math.floor(weeks / 1.5))
  return (
    <div className={`journey journey--act1 journey--training ${reduced ? 'is-static' : ''}`} ref={root} data-testid="journey-act1">
      <div className={reduced ? 'training-static' : undefined} data-testid={reduced ? 'training-static' : undefined}>
      <div className="journey-beats" aria-live="polite">
        {beats.map((b, i) => (
          <p key={i} className="journey-beat" data-beat data-testid="journey-beat">
            {b.text}
          </p>
        ))}
      </div>

      {reduced && (
        <ol className="training-static-weeks" aria-label="Eight-week basic training demonstration">
          {Array.from({ length: TRAINING_WEEKS }, (_, i) => <li key={i} data-testid="training-week">Week {i + 1}</li>)}
        </ol>
      )}

      <div className="training-gallery" aria-label="Coast Guard boot camp training photography">
        {TRAINING_PHOTOS.map((photo, i) => (
          <figure className={`training-photo ${reduced || photoIndex === i ? 'is-active' : ''}`} key={photo.caption} aria-hidden={!reduced && photoIndex !== i}>
            <SafeImage src={photo.src} alt={photo.alt} loading="eager" />
            <figcaption style={{ pointerEvents: reduced || photoIndex === i ? 'auto' : 'none' }}>
              {photo.caption} <a className="training-credit" href={photo.source} tabIndex={reduced || photoIndex === i ? 0 : -1} style={{ pointerEvents: reduced || photoIndex === i ? 'auto' : 'none' }} target="_blank" rel="noopener noreferrer">USCG photo · source</a>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="journey-counter" data-counter>
        <DaysCounter days={days} totalDays={totalDays} shipDate={shipDate} weeks={weeks} />
      </div>
      {reduced && (
        <>
          <p className="training-graduation" data-testid="training-graduation">Graduation · eight-week training demonstration complete.</p>
          <button className="btn btn-primary journey-continue" onClick={() => finish(false)} data-testid="journey-continue">
            {LABELS.continue} <span aria-hidden="true">→</span>
          </button>
        </>
      )}
      </div>
    </div>
  )
}
