import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { MapHandle, JourneyMarker } from '../MapView'
import { prefersReducedMotion } from '../../lib/motion'
import { sound } from '../../lib/audio'
import { buildPatrolLegs, legDuration, patrolMiles, PATROL_STOPS } from '../../journey/patrol'
import { PATROL } from '../../journey/copy'
import { MilesCounter } from './MilesCounter'
import { SoundToggle } from './SoundToggle'

interface Props {
  map: MapHandle | null
  /** Fires once when the patrol ends (or Esc skips it). */
  onDone: (opts: { skipped: boolean }) => void
}

/** Port cards live this long — but the ship sails on underneath them. */
const CARD_LIFE_S = 4.5
const CANAL_LIFE_S = 5.5
const FRAME_S = 0.55

/**
 * The Polar Star first patrol — Seattle → Honolulu → Hobart → Wellington →
 * Punta Arenas → Cape Horn → Rio → Panama Canal → home. One GSAP timeline is
 * the master clock; the map camera frames each leg, the arc extends port to
 * port, port cards (DVIDS photos) slide in at each stop, and the Panama card
 * plays a lock-chamber animation. Esc quietly ends the patrol (no overlay
 * chrome — owner preference).
 */
export function PatrolOverlay({ map, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const reduced = prefersReducedMotion()

  const legs = useMemo(() => buildPatrolLegs(), [])
  const fullPath = useMemo(() => legs.flatMap((l, i) => (i === 0 ? l.points : l.points.slice(1))), [legs])
  const totalMiles = useMemo(() => patrolMiles(legs), [legs])
  const [miles, setMiles] = useState(reduced ? totalMiles : 0)
  const [portLabel, setPortLabel] = useState(PATROL_STOPS[1].name)

  const finish = (skipped: boolean) => {
    if (done.current) return
    done.current = true
    onDoneRef.current({ skipped })
  }

  useEffect(() => {
    if (!map || !root.current) return
    done.current = false
    sound.enable()
    sound.ambient()

    const markerFor = (i: number): JourneyMarker => ({
      id: PATROL_STOPS[i].id,
      lngLat: PATROL_STOPS[i].lngLat,
      label: PATROL_STOPS[i].name,
      sublabel: PATROL_STOPS[i].country,
      kind: i === 0 || i === PATROL_STOPS.length - 1 ? 'home' : 'unit',
    })

    if (reduced) {
      map.setJourneyMarkers(PATROL_STOPS.map((_, i) => markerFor(i)))
      map.fitPoints(fullPath, { duration: 0, pitch: 0, padding: { top: 90, bottom: 110, left: 70, right: 70 } })
      map.drawArc(fullPath, 1)
      return
    }

    const cards = Array.from(root.current.querySelectorAll<HTMLElement>('[data-port-card]'))
    const beatEl = root.current.querySelector<HTMLElement>('[data-patrol-beat]')
    const markers: JourneyMarker[] = [markerFor(0)]
    map.setJourneyMarkers(markers)
    map.drawArc(fullPath, 0)

    // Sample offsets so each leg maps onto a slice of the full-path progress.
    const legSamples = legs.map((l, i) => (i === 0 ? l.points.length : l.points.length - 1))
    const totalSamples = legSamples.reduce((a, b) => a + b, 0)

    const tl = gsap.timeline({ defaults: { ease: 'none' } })
    tl.call(() => sound.horn())

    let samplesBefore = 0
    let milesBefore = 0
    let t = 0.3 // small lead-in
    legs.forEach((leg, k) => {
      const dur = legDuration(leg)
      const sBefore = samplesBefore
      const mBefore = milesBefore
      const stop = PATROL_STOPS[k + 1]
      // Camera frames everything sailed so far PLUS this leg — the whole
      // trackline stays in view and grows across the world.
      const framePts = leg.points

      // Frame this leg, update the "underway" beat, departure whoosh.
      tl.call(
        () => {
          map.fitPoints(framePts, {
            duration: FRAME_S * 1000,
            pitch: 0,
            maxZoom: 3.5,
            padding: { top: 110, bottom: window.innerWidth <= 860 ? 280 : 210, left: 80, right: 80 },
          })
          setPortLabel(stop.name)
          sound.whoosh()
          if (beatEl) {
            gsap.fromTo(beatEl, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' })
          }
        },
        [],
        t,
      )
      t += FRAME_S * 0.5

      // Extend the arc across this leg; tick the cumulative miles.
      const proxy = { p: 0 }
      tl.to(
        proxy,
        {
          p: 1,
          duration: dur,
          ease: 'power1.inOut',
          onUpdate: () => {
            map.drawArc(fullPath, (sBefore + proxy.p * legSamples[k]) / totalSamples)
            setMiles(mBefore + proxy.p * leg.miles)
          },
        },
        t,
      )
      t += dur

      // Arrival: marker drops, chime hits, the port card pops — and the ship
      // sails straight on to the next leg. The card lives (and dies) on its
      // own clock, overlapping the next passage. Boop — boop — boop.
      const card = cards[k]
      const life = stop.special === 'canal' ? CANAL_LIFE_S : CARD_LIFE_S
      tl.call(
        () => {
          markers.push(markerFor(k + 1))
          map.setJourneyMarkers([...markers])
          if (stop.special === 'homecoming') sound.fanfare()
          else sound.chime()
          if (beatEl) gsap.to(beatEl, { opacity: 0, duration: 0.25 })
        },
        [],
        t,
      )
      if (card) {
        tl.fromTo(card, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, t + 0.03)
        if (stop.special === 'canal') {
          // Lock-chamber animation: water rises, the ship silhouette lifts with it.
          tl.fromTo(card.querySelectorAll('.canal-water'), { attr: { height: 10, y: 52 } }, { attr: { height: 40, y: 22 }, duration: 1.8, ease: 'power1.inOut', stagger: 0.35 }, t + 0.4)
          tl.to(card.querySelector('.canal-ship'), { y: -26, duration: 2.1, ease: 'power1.inOut' }, t + 0.4)
        }
        tl.to(card, { opacity: 0, y: -24, duration: 0.4, ease: 'power2.in' }, t + life)
      }
      // Homecoming gets a breath for the fanfare; every other port: sail on NOW.
      t += life + 0.1

      samplesBefore += legSamples[k]
      milesBefore += leg.miles
    })

    // Home: frame the entire patrol route at readable scale, then hand off to explore.
    tl.call(
      () => {
        map.fitPoints(fullPath, {
          duration: 2600,
          pitch: 28,
          padding: { top: 140, bottom: 140, left: 100, right: 100 }
        })
      },
      [],
      t,
    )
    tl.call(() => finish(false), [], t + 3.2)

    return () => {
      tl.kill()
      sound.stopAmbient()
      gsap.set([...cards, beatEl].filter(Boolean) as HTMLElement[], { clearProps: 'all' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  /* Quiet Esc: complete the route instantly and move on. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      map?.stop()
      sound.stopAmbient()
      map?.drawArc(fullPath, 1)
      setMiles(totalMiles)
      finish(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fullPath, totalMiles])

  return (
    <div className={`patrol ${reduced ? 'is-static' : ''}`} ref={root} data-testid="patrol">
      <SoundToggle />
      <div className="patrol-head">
        <div className="patrol-eyebrow">{PATROL.eyebrow}</div>
        <div className="patrol-title">{PATROL.title}</div>
      </div>

      {!reduced && (
        <p className="patrol-beat" data-patrol-beat aria-live="polite">
          Underway — <strong>{portLabel}</strong>
        </p>
      )}

      {/* Port cards (one per arrival) */}
      {!reduced &&
        PATROL_STOPS.slice(1).map((stop) => (
          <div className="port-card" key={stop.id} data-port-card data-testid={`port-${stop.id}`}>
            <img className="port-img" src={stop.img} alt={`${stop.name} port call`} loading="eager" />
            <div className="port-body">
              <div className="port-eyebrow">
                {stop.special === 'canal' ? PATROL.canalTitle : PATROL.arrived}
              </div>
              <div className="port-name">
                <span className="port-flag" aria-hidden="true">
                  {stop.flag}
                </span>
                {stop.name}
                <span className="port-country">{stop.country}</span>
              </div>
              <p className="port-blurb">{stop.blurb}</p>
              {stop.special === 'canal' && (
                <svg className="canal-locks" viewBox="0 0 220 64" aria-hidden="true">
                  <rect x="0" y="56" width="220" height="8" fill="#0e1830" />
                  {[0, 1, 2].map((i) => (
                    <g key={i}>
                      <rect className="canal-water" x={14 + i * 68} y="52" width="56" height="10" rx="2" fill="#22d3ee" opacity="0.5" />
                      <rect x={8 + i * 68} y="18" width="5" height="44" fill="#6f7d94" />
                      <rect x={72 + i * 68} y="18" width="5" height="44" fill="#6f7d94" />
                    </g>
                  ))}
                  <g className="canal-ship">
                    <rect x="26" y="40" width="34" height="8" rx="2" fill="#f3c25a" />
                    <rect x="36" y="33" width="10" height="7" fill="#f3f6fb" />
                  </g>
                </svg>
              )}
            </div>
          </div>
        ))}

      {/* Static fallback for prefers-reduced-motion */}
      {reduced && (
        <div className="patrol-static">
          <ol className="patrol-static-list">
            {PATROL_STOPS.slice(1).map((stop) => (
              <li key={stop.id}>
                <span aria-hidden="true">{stop.flag}</span> {stop.name} — {stop.country}
              </li>
            ))}
          </ol>
          <button className="btn btn-primary journey-continue" onClick={() => finish(false)} data-testid="journey-continue">
            {PATROL.continue} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      <div className="journey-counter patrol-counter">
        <MilesCounter miles={miles} total={totalMiles} place={PATROL.totalLabel} />
      </div>
    </div>
  )
}
