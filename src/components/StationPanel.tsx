import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Unit } from '../data/schema'
import { UNIT_TYPE_COLORS, REGION_LABELS } from '../lib/units'
import { prefersReducedMotion } from '../lib/motion'
import { HeaderArt } from './HeaderArt'
import { Narration } from './Narration'
import { IconBack, IconClose } from './Icons'

const TABS = ['Overview', 'Missions', 'History', 'Gallery', 'Narration'] as const
type Tab = (typeof TABS)[number]

interface Props {
  unit: Unit
  isNarrow: boolean
  audioEnabled: boolean
  onEnableAudio: () => void
  /** Optional ribbon text shown above the header art (e.g. "Your first unit"). */
  ribbon?: string
  /** Called after the exit animation completes. */
  onClose: () => void
}

/**
 * Slide-in detail panel (right drawer on desktop, bottom sheet on narrow screens).
 * GSAP drives enter/exit; reduced-motion users get instant transitions.
 */
export function StationPanel({ unit, isNarrow, audioEnabled, onEnableAudio, ribbon, onClose }: Props) {
  const root = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<Tab>('Overview')
  const closing = useRef(false)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const mounted = useRef(false)

  /* enter animation (full slide on mount; content-only stagger when switching units) */
  useLayoutEffect(() => {
    if (!root.current) return
    const axis = isNarrow ? 'y' : 'x'
    if (prefersReducedMotion()) {
      gsap.set(root.current, { x: 0, y: 0, opacity: 1 })
      mounted.current = true
      return
    }
    const first = !mounted.current
    // `mounted` flips only when the slide completes, so React StrictMode's synchronous
    // effect re-run (which reverts this timeline) still replays the full entrance.
    const tl = gsap.timeline({ onComplete: () => (mounted.current = true) })
    if (first) {
      tl.fromTo(
        root.current,
        { [axis]: '100%', opacity: 0.6 },
        { [axis]: 0, opacity: 1, duration: 0.65, ease: 'power3.out' },
      )
    }
    tl.from(
      root.current.querySelectorAll('[data-stagger]'),
      { y: 14, opacity: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 },
      first ? '-=0.3' : 0,
    )
    return () => {
      // revert (not kill) so partially-applied `from` values never leak into the next run
      tl.revert()
    }
    // re-run only when the unit changes (new panel content), not on tab change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id])

  useEffect(() => {
    setTab('Overview')
    closing.current = false
    closeBtn.current?.focus({ preventScroll: true })
  }, [unit.id])

  const requestClose = () => {
    if (closing.current) return
    closing.current = true
    if (!root.current || prefersReducedMotion()) {
      onClose()
      return
    }
    const axis = isNarrow ? 'y' : 'x'
    gsap.to(root.current, { [axis]: '100%', opacity: 0.6, duration: 0.45, ease: 'power3.in', onComplete: onClose })
  }

  /* Esc closes */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNarrow])

  const color = UNIT_TYPE_COLORS[unit.unitType]

  return (
    <aside
      ref={root}
      className="panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="panel-title"
      data-testid="station-panel"
    >
      <div className="panel-scroll">
        {ribbon && (
          <div className="panel-ribbon" data-testid="panel-ribbon">
            <span className="panel-ribbon-dot" aria-hidden="true" />
            {ribbon}
          </div>
        )}
        <div className="panel-hero">
          <HeaderArt unit={unit} />
          <span className="panel-hero-tag">Placeholder header art · no photo yet</span>
          <button ref={closeBtn} className="panel-close" onClick={requestClose} aria-label="Close panel">
            <IconClose />
          </button>
        </div>

        <header className="panel-head">
          <span className="badge" style={{ ['--c' as string]: color }} data-stagger>
            {unit.unitType}
          </span>
          <h2 id="panel-title" className="panel-title" data-stagger data-testid="panel-title">
            {unit.name}
          </h2>
          <div className="panel-loc" data-stagger>
            <span>
              {unit.city}, {unit.state}
            </span>
            <span className="sep">•</span>
            <span>{REGION_LABELS[unit.region]}</span>
            {unit.district && (
              <>
                <span className="sep">•</span>
                <span>District {unit.district.replace('D', '')}</span>
              </>
            )}
          </div>
        </header>

        <div className="tabs" role="tablist" aria-label="Unit details" data-stagger>
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`tabpanel-${t}`}
              className="tab"
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="tabpanel" role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`} data-stagger>
          {tab === 'Overview' && (
            <>
              <dl className="facts">
                <div className="fact">
                  <dt>Unit type</dt>
                  <dd>{unit.unitType}</dd>
                </div>
                <div className="fact">
                  <dt>Location</dt>
                  <dd>
                    {unit.city}, {unit.state}
                  </dd>
                </div>
                <div className="fact">
                  <dt>Coordinates</dt>
                  <dd>
                    {unit.lat.toFixed(2)}, {unit.lng.toFixed(2)}
                    {!unit.coordsVerified && <small style={{ color: 'var(--ink-500)' }}> (approx.)</small>}
                  </dd>
                </div>
                <div className="fact">
                  <dt>Review status</dt>
                  <dd style={{ color: 'var(--gold-300)' }}>{unit.contentReviewStatus}</dd>
                </div>
              </dl>
              <h3>Summary</h3>
              <p>{unit.missionSummary}</p>
              <div className="notice">
                <span aria-hidden="true">⚠︎</span>
                <span>
                  Demo content. Facts, coordinates and history have not been verified against official sources
                  {unit.lastVerified ? ` (last verified ${unit.lastVerified})` : ' (never verified)'}.
                </span>
              </div>
            </>
          )}
          {tab === 'Missions' && (
            <>
              <h3>Mission profile</h3>
              <p>{unit.missionSummary}</p>
              <h3>Typical mission areas (demo)</h3>
              <p style={{ color: 'var(--ink-400)' }}>
                Search and rescue · Ports, waterways and coastal security · Marine safety · Environmental response ·
                Law enforcement. Unit-specific breakdown pending verification.
              </p>
            </>
          )}
          {tab === 'History' && (
            <>
              <h3>History</h3>
              <p>{unit.history}</p>
              <div className="notice">
                <span aria-hidden="true">⚠︎</span>
                <span>Placeholder — no historical claims are made in this demo build.</span>
              </div>
            </>
          )}
          {tab === 'Gallery' && (
            <>
              <h3>Gallery</h3>
              {unit.images.length === 0 ? (
                <div className="gallery" aria-label="Placeholder gallery">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="gallery-tile" aria-hidden="true">
                      Image {i + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gallery">
                  {unit.images.map((img) => (
                    <img key={img.src} src={img.src} alt={img.alt} className="gallery-tile" />
                  ))}
                </div>
              )}
              <p className="narration-status">Placeholder tiles. Licensed imagery will be added with attribution.</p>
            </>
          )}
          {tab === 'Narration' && (
            <Narration
              unitName={unit.name}
              script={unit.narrationScript}
              audioSrc={unit.narrationAudio}
              audioEnabled={audioEnabled}
              onEnableAudio={onEnableAudio}
            />
          )}
        </div>
      </div>

      <footer className="panel-footer">
        <button className="btn btn-ghost" onClick={requestClose} data-testid="back-to-map">
          <IconBack /> Back to map
        </button>
        <small>Esc to close</small>
      </footer>
    </aside>
  )
}
