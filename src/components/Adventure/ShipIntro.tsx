import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Unit } from '../../data/schema'
import { prefersReducedMotion } from '../../lib/motion'
import { sound } from '../../lib/audio'
import { SHIP } from '../../journey/copy'

interface Props {
  unit: Unit
  /** Fires when the recruit starts the patrol. */
  onBegin: () => void
}

/**
 * Polar Star mission card — hero photo, class, homeport, mission list, and
 * the "set sail" CTA that launches the patrol cinematic. Photos are DVIDS
 * public-domain assets bundled under /media (ASSET_LICENSES.md).
 */
export function ShipIntro({ unit, onBegin }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (!root.current || reduced) return
    const ctx = gsap.context(() => {
      gsap.from('.ship-hero img', { scale: 1.12, duration: 6, ease: 'power1.out' })
      gsap.from('[data-ship-reveal]', { y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.2 })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  // Quiet Esc advances (no overlay chrome — owner preference).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBegin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBegin])

  const begin = () => {
    sound.enable()
    sound.horn()
    sound.whoosh()
    onBegin()
  }

  return (
    <div className="ship-intro" ref={root} role="dialog" aria-labelledby="ship-title" data-testid="ship-intro">
      <div className="ship-card">
        <div className="ship-hero" data-ship-reveal>
          <img src="/media/polar-star-hero.jpg" alt={`${unit.name} underway`} />
          <div className="ship-hero-scrim" />
          <div className="ship-hero-text">
            <div className="ship-eyebrow">{SHIP.eyebrow}</div>
            <h2 id="ship-title" className="ship-name">
              {SHIP.name} <span className="ship-hull">{SHIP.hull}</span>
            </h2>
            <div className="ship-class">
              {SHIP.klass} · {SHIP.homeport}
            </div>
          </div>
        </div>

        <div className="ship-body">
          <p className="ship-summary" data-ship-reveal>
            {SHIP.summary}
          </p>
          <ul className="ship-missions" data-ship-reveal>
            {SHIP.missions.map((m) => (
              <li key={m}>
                <span className="ship-mission-dot" aria-hidden="true" />
                {m}
              </li>
            ))}
          </ul>
          <div className="ship-gallery" data-ship-reveal>
            <img src="/media/mission-ice.jpg" alt="Polar Star crew on the Antarctic ice" loading="lazy" />
            <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Emperor_penguins.jpg?width=1000" alt="Emperor penguins on Antarctic sea ice" loading="lazy" />
          </div>
          <div className="ship-foot" data-ship-reveal>
            <span className="ship-demo-note">{SHIP.demoNote}</span>
            <button className="btn btn-primary" onClick={begin} data-testid="ship-begin">
              {SHIP.begin} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
