import { SafeImage } from '../SafeImage'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { MapHandle, JourneyMarker } from '../MapView'
import { prefersReducedMotion } from '../../lib/motion'
import { sound } from '../../lib/audio'
import { buildPatrolLegs, legDuration, patrolMiles, PATROL_STOPS } from '../../journey/patrol'
import { PATROL } from '../../journey/copy'
import { MilesCounter } from './MilesCounter'
import '../../styles/voyage-stage.css'

interface Props {
  map: MapHandle | null
  onDone: (opts: { skipped: boolean }) => void
}

// Preserve the authored itinerary and arrival holds. Details pause this clock.
const CARD_LIFE_S = 3.8
const CANAL_LIFE_S = 4.4
const ANTARCTIC_LIFE_S = 10.2
const FRAME_S = 0.55

function CanalLocks() {
  return <svg className="canal-locks" viewBox="0 0 220 64" aria-hidden="true">
    <rect x="0" y="56" width="220" height="8" fill="#0e1830" />
    {[0, 1, 2].map(i => <g key={i}>
      <rect className="canal-water" x={14 + i * 68} y="52" width="56" height="10" rx="2" fill="#22d3ee" opacity="0.7" />
      <rect x={8 + i * 68} y="18" width="5" height="44" fill="#a5c5cf" />
      <rect x={72 + i * 68} y="18" width="5" height="44" fill="#a5c5cf" />
    </g>)}
    <g className="canal-ship"><rect x="26" y="40" width="34" height="8" rx="2" fill="#f3c25a" /><rect x="36" y="33" width="10" height="7" fill="#f3f6fb" /></g>
  </svg>
}

/** The globe owns the stage; destination photographs expand only by request. */
export function PatrolOverlay({ map, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const reduced = prefersReducedMotion()
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const legCamera = useRef<{ points: ReturnType<typeof buildPatrolLegs>[number]['points']; until: number } | null>(null)
  const legs = useMemo(() => buildPatrolLegs(), [])
  const fullPath = useMemo(() => legs.flatMap((leg, i) => i === 0 ? leg.points : leg.points.slice(1)), [legs])
  const totalMiles = useMemo(() => patrolMiles(legs), [legs])
  const [miles, setMiles] = useState(reduced ? totalMiles : 0)
  const [legIndex, setLegIndex] = useState(0)
  const [visited, setVisited] = useState(reduced ? legs.length : 0)
  const [activeStop, setActiveStop] = useState<string | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const detailsIdRef = useRef(detailsId)
  detailsIdRef.current = detailsId
  const detailStop = PATROL_STOPS.find(stop => stop.id === detailsId)

  const finish = (skipped: boolean) => {
    if (done.current) return
    done.current = true
    onDoneRef.current({ skipped })
  }

  const closeDetails = useCallback(() => {
    setDetailsId(null)
    const tl = timeline.current
    const camera = legCamera.current
    if (tl && camera && camera.until > tl.time()) {
      map?.frameVoyageLeg(camera.points, { duration: (camera.until - tl.time()) * 1000 })
    }
    tl?.resume()
    window.requestAnimationFrame(() => {
      if (returnFocus.current?.isConnected) returnFocus.current.focus()
    })
  }, [map])

  const openDetails = (id: string, trigger: HTMLElement) => {
    timeline.current?.pause()
    map?.stop()
    returnFocus.current = trigger
    setDetailsId(id)
  }

  useEffect(() => {
    if (!map || !root.current) return
    done.current = false
    sound.enable()
    sound.ambient()
    const markerFor = (i: number): JourneyMarker => ({
      id: PATROL_STOPS[i].id,
      lngLat: i === 0 ? PATROL_STOPS[0].lngLat : legs[i - 1].points.at(-1)!,
      label: PATROL_STOPS[i].name,
      sublabel: PATROL_STOPS[i].country,
      kind: i === 0 || i === PATROL_STOPS.length - 1 ? 'home' : 'unit',
    })
    if (reduced) {
      setVisited(legs.length)
      map.setJourneyMarkers(PATROL_STOPS.map((_, i) => markerFor(i)))
      map.drawArc(fullPath, 1)
      map.frameVoyageLeg([PATROL_STOPS[0].lngLat], { duration: 0 })
      return () => {
        map.stop()
        map.getMap()?.setPadding({ top: 0, bottom: 0, left: 0, right: 0 })
        sound.stopAmbient()
      }
    }

    const cards = Array.from(root.current.querySelectorAll<HTMLElement>('[data-port-card]'))
    const markers: JourneyMarker[] = [markerFor(0)]
    map.setJourneyMarkers(markers)
    map.drawArc(fullPath, 0)
    map.frameVoyageLeg(legs[0].points, { duration: 0 })
    const legSamples = legs.map((leg, i) => i === 0 ? leg.points.length : leg.points.length - 1)
    const totalSamples = legSamples.reduce((a, b) => a + b, 0)
    const tl = gsap.timeline({ defaults: { ease: 'none' } })
    timeline.current = tl
    tl.call(() => sound.horn())
    let samplesBefore = 0
    let milesBefore = 0
    let t = 0.3
    legs.forEach((leg, k) => {
      const dur = legDuration(leg)
      const sBefore = samplesBefore
      const mBefore = milesBefore
      const stop = PATROL_STOPS[k + 1]
      const departure = t
      tl.call(() => {
        setLegIndex(k)
        legCamera.current = { points: leg.points, until: departure + dur }
        map.frameVoyageLeg(leg.points, { duration: dur * 1000 })
        sound.whoosh()
      }, [], t)
      t += FRAME_S * 0.5
      const progress = { p: 0 }
      tl.to(progress, {
        p: 1, duration: dur, ease: 'power1.inOut',
        onUpdate: () => {
          map.drawArc(fullPath, (sBefore + progress.p * legSamples[k]) / totalSamples)
          setMiles(mBefore + progress.p * leg.miles)
        },
      }, t)
      t += dur
      const card = cards[k]
      const life = stop.gallery ? ANTARCTIC_LIFE_S : stop.special === 'canal' ? CANAL_LIFE_S : CARD_LIFE_S
      tl.call(() => {
        setActiveStop(stop.id)
        setActiveSlide(0)
        setVisited(k + 1)
        markers.push(markerFor(k + 1))
        map.setJourneyMarkers([...markers])
        if (stop.special === 'homecoming') sound.fanfare()
        else sound.chime()
      }, [], t)
      if (card && stop.gallery) {
        const slides = Array.from(card.querySelectorAll<HTMLElement>('[data-antarctic-slide]'))
        slides.forEach((slide, index) => {
          tl.set(slide, { opacity: index === 0 ? 1 : 0 }, t + 0.02)
          if (index > 0) {
            tl.call(() => setActiveSlide(index), [], t + 0.4 + index * 2.1)
            tl.to(slide, { opacity: 1, duration: 0.55, ease: 'power2.inOut' }, t + 0.4 + index * 2.1)
          }
          if (index < slides.length - 1) tl.to(slide, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, t + 0.4 + (index + 1) * 2.1)
        })
      }
      if (card) {
        tl.fromTo(card, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, t + 0.03)
        if (stop.special === 'canal') {
          tl.fromTo(card.querySelectorAll('.canal-water'), { attr: { height: 10, y: 52 } }, { attr: { height: 40, y: 22 }, duration: 1.8, ease: 'power1.inOut', stagger: 0.35 }, t + 0.4)
          tl.to(card.querySelector('.canal-ship'), { y: -26, duration: 2.1, ease: 'power1.inOut' }, t + 0.4)
        }
        tl.to(card, { opacity: 0, y: -8, duration: 0.4, ease: 'power2.in' }, t + life)
        tl.call(() => setActiveStop(null), [], t + life + 0.4)
      }
      t += life + 0.55
      samplesBefore += legSamples[k]
      milesBefore += leg.miles
    })
    tl.call(() => {
      const points = [PATROL_STOPS.at(-1)!.lngLat]
      legCamera.current = { points, until: t + 2.6 }
      map.frameVoyageLeg(points, { duration: 2600 })
    }, [], t)
    tl.call(() => finish(false), [], t + 3.2)
    return () => {
      tl.revert()
      timeline.current = null
      map.stop()
      map.getMap()?.setPadding({ top: 0, bottom: 0, left: 0, right: 0 })
      sound.stopAmbient()
    }
    // Scene setup owns a single timeline. Current onDone is read through its ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    if (!map) return
    let frame = 0
    const reframe = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        // Read the new CSS stage after rotation, then update the native camera.
        // A paused gallery stays paused; an underway leg retains its end time.
        map.getMap()?.resize()
        const camera = legCamera.current
        const tl = timeline.current
        const points = camera?.points ?? (reduced ? [PATROL_STOPS[0].lngLat] : legs[0].points)
        const duration = !detailsIdRef.current && tl && camera ? Math.max(0, camera.until - tl.time()) * 1000 : 0
        map.frameVoyageLeg(points, { duration, reflow: true })
      })
    }
    window.addEventListener('resize', reframe)
    return () => {
      window.removeEventListener('resize', reframe)
      window.cancelAnimationFrame(frame)
    }
  }, [map, legs, reduced])

  useEffect(() => {
    if (!detailsId || !root.current) return
    const dialog = root.current.querySelector<HTMLElement>('.voyage-details')
    dialog?.querySelector<HTMLButtonElement>('[data-testid="gallery-close"]')?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeDetails()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], [tabindex]')).filter(el => el.tabIndex >= 0)
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first?.focus()
      }
    }
    window.addEventListener('keydown', trapFocus, true)
    return () => window.removeEventListener('keydown', trapFocus, true)
  }, [detailsId, closeDetails])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || detailsIdRef.current) return
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
    <div className={`patrol voyage-stage${reduced ? ' is-static' : ''}`} ref={root} data-testid="patrol" data-gallery-open={!!detailsId}>
      <header className="voyage-header" aria-hidden={detailsId ? true : undefined}>
        <div><p>{PATROL.eyebrow}</p><h2>{PATROL.title}</h2></div>
        <span className="voyage-chapter">09 STOPS</span>
      </header>
      <div className="voyage-globe-stage" data-testid="voyage-globe-stage" aria-hidden="true">
        <p className="voyage-leg-status">{reduced ? 'The complete illustrative voyage' : `${legs[legIndex].from.name} → ${legs[legIndex].to.name}`}</p>
      </div>
      {reduced ? (
        <section className="patrol-static voyage-static-dock" aria-label="Voyage stops — scroll to read" aria-hidden={detailsId ? true : undefined}>
          <ol className="patrol-static-list" aria-label="Complete voyage itinerary">
            {PATROL_STOPS.slice(1).map((stop, index) => <li key={stop.id}>
              <strong>{String(index + 1).padStart(2, '0')} / {stop.name}</strong><span>{stop.country}</span>
              <p className="patrol-static-blurb">{stop.blurb}</p>
              <button onClick={event => openDetails(stop.id, event.currentTarget)} aria-haspopup="dialog">Photos &amp; details</button>
            </li>)}
          </ol>
        </section>
      ) : (
        <section className="voyage-dock-slot" aria-label="Current port" aria-live="polite" aria-hidden={detailsId ? true : undefined}>
          <div className="voyage-underway" aria-hidden={!!activeStop}><span>UNDERWAY</span><strong>{legs[legIndex].to.name}</strong><small>The voyage continues</small></div>
          {PATROL_STOPS.slice(1).map((stop, index) => {
            const shown = activeStop === stop.id
            const photo = stop.gallery?.[activeSlide]
            const source = photo?.source ?? stop.photoSource
            return <article className="port-card voyage-port-dock" key={stop.id} aria-hidden={!shown} data-port-card data-testid={`port-${stop.id}`}>
              <div className="voyage-thumb">
                {stop.gallery ? stop.gallery.map((image, slide) => <div className="antarctic-slide" data-antarctic-slide key={image.source} aria-hidden={!shown || activeSlide !== slide} style={{ opacity: slide === 0 ? 1 : 0 }}>
                  <SafeImage src={image.img} alt={image.caption} loading="eager" />
                </div>) : <SafeImage className="port-img" src={stop.img} alt={`Scenic destination photograph: ${stop.name}`} loading="eager" />}
                {stop.special === 'canal' && <CanalLocks />}
                {source && <a className="voyage-thumb-credit" tabIndex={shown ? 0 : -1} href={source} target="_blank" rel="noopener noreferrer">Source</a>}
              </div>
              <div className="voyage-port-identity"><p>{String(index + 1).padStart(2, '0')} / {stop.special === 'canal' ? 'CANAL TRANSIT' : stop.special === 'homecoming' ? 'HOME AGAIN' : 'PORT CALL'}</p><h3>{stop.name}</h3><span>{stop.country}</span></div>
              <button className="voyage-details-button" data-testid={`port-details-${stop.id}`} tabIndex={shown ? 0 : -1} onClick={event => openDetails(stop.id, event.currentTarget)} aria-haspopup="dialog" aria-label={`Photos and details: ${stop.name}`}>Details <span aria-hidden="true">↗</span></button>
            </article>
          })}
        </section>
      )}
      <footer className="voyage-footer" aria-hidden={detailsId ? true : undefined}>
        <ol className="voyage-stop-rail" aria-label="Voyage progression">
          {PATROL_STOPS.slice(1).map((stop, index) => <li key={stop.id} className={index < visited ? 'is-visited' : ''} aria-current={activeStop === stop.id ? 'step' : undefined} title={`${stop.name}${index < visited ? ' — visited' : ' — ahead'}`}><span>{String(index + 1).padStart(2, '0')}</span><span className="sr-only">{stop.name}{index < visited ? ', visited' : ', ahead'}</span></li>)}
        </ol>
        <MilesCounter miles={miles} total={totalMiles} place={PATROL.totalLabel} cumulative />
        {reduced && <button className="btn btn-primary journey-continue" data-testid="journey-continue" onClick={() => finish(false)}>{PATROL.continue} <span aria-hidden="true">→</span></button>}
      </footer>
      <p className="voyage-credit-space" aria-hidden="true">ILLUSTRATIVE VOYAGE · CUMULATIVE ROUTE</p>
      {detailStop && <div className="voyage-details-backdrop" onClick={event => { if (event.target === event.currentTarget) closeDetails() }}>
        <section className="voyage-details" role="dialog" aria-modal="true" aria-labelledby="voyage-details-title" aria-describedby="voyage-details-description" data-testid="voyage-details">
          <header><div><p>VOYAGE PAUSED / {detailStop.country}</p><h2 id="voyage-details-title">{detailStop.name}</h2></div><button onClick={closeDetails} data-testid="gallery-close" aria-label="Close details and resume voyage">Close <span aria-hidden="true">×</span></button></header>
          <div className="voyage-details-content"><p className="port-blurb" id="voyage-details-description">{detailStop.blurb}</p>
            {detailStop.special === 'canal' && <CanalLocks />}
            <div className="voyage-gallery-grid" data-testid="gallery-grid">{(detailStop.gallery ?? [{ img: detailStop.img, caption: detailStop.name, source: detailStop.photoSource }]).map(photo => <figure key={photo.img}><SafeImage src={photo.img} alt={photo.caption} loading="eager" /><figcaption>{photo.caption}{photo.source && <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.source.includes('commons.wikimedia.org') ? 'Photo credit & license' : 'USCG photo · source'}</a>}</figcaption></figure>)}</div>
            <p className="voyage-details-note">Illustrative itinerary and assignments. Photographs show real places and different deployments, not one guaranteed patrol.</p>
          </div>
        </section>
      </div>}
    </div>
  )
}
