import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../lib/motion'
import { LANDING } from '../../journey/copy'
import { dateParts, daysUntil, formatLong, isISODate, nextShipDates, toISODate } from '../../journey/dates'
import { LandingArt } from './LandingArt'
import { MissionMosaic } from './MissionMosaic'
import { DISCLAIMER } from './ZipEntry'

interface Props {
  /** Chosen ISO ship date; the parent starts Act 1 after the exit tween completes. */
  onBegin: (shipDate: string) => void
  /** Quiet secondary path into free-explore mode. */
  onExplore: () => void
}

/**
 * "Pick your basic training date" — the default entry (owner decision, DECISIONS.md).
 * Dark nautical hero + photo wall, a row of upcoming Cape May ship-date cards
 * (demo schedule: next 8 Tuesdays ≥ 14 days out) and a native date fallback.
 * Keyboard: arrows move between cards, Enter/Space selects, Enter on the form begins.
 */
export function DateEntry({ onBegin, onExplore }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const exiting = useRef(false)
  const dates = useMemo(() => nextShipDates(new Date()), [])
  const [selected, setSelected] = useState<string | null>(dates[0] ?? null)
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const minCustom = useMemo(() => toISODate(new Date()), [])

  useEffect(() => {
    listRef.current?.querySelector<HTMLButtonElement>('[data-date-card]')?.focus({ preventScroll: true })
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.15 })
      gsap.to('.landing-ring', {
        scale: 1.06,
        opacity: 0.35,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: { each: 0.6, from: 'center' },
        transformOrigin: '50% 50%',
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const exit = (then: () => void) => {
    if (exiting.current) return
    exiting.current = true
    if (!root.current || prefersReducedMotion()) {
      then()
      return
    }
    gsap.to(root.current, { opacity: 0, scale: 1.03, duration: 0.7, ease: 'power2.inOut', onComplete: then })
  }

  const pick = (iso: string) => {
    setSelected(iso)
    setCustom('')
    if (error) setError(null)
  }

  const onCustom = (value: string) => {
    setCustom(value)
    if (error) setError(null)
    if (isISODate(value)) setSelected(value)
    else if (value === '') setSelected(dates[0] ?? null)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (exiting.current) return
    // Prefer the card that actually carries focus (Enter path) over possibly-stale state.
    const focused = (document.activeElement as HTMLElement | null)?.getAttribute?.('data-iso')
    const iso = focused && isISODate(focused) ? focused : selected
    if (!iso) {
      setError(LANDING.errors.none)
      return
    }
    if (!isISODate(iso)) {
      setError(LANDING.errors.invalid)
      return
    }
    if (daysUntil(iso) < 0) {
      setError(LANDING.errors.past)
      return
    }
    exit(() => onBegin(iso))
  }

  /* roving arrow keys across the cards */
  const onCardKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const cards = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-date-card]')
    if (!cards?.length) return
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % cards.length
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + cards.length) % cards.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = cards.length - 1
    if (e.key === 'Enter') {
      // Enter on a card = pick it and begin (Space just selects).
      e.preventDefault()
      pick(dates[i])
      setSelected(dates[i])
      e.currentTarget.form?.requestSubmit()
      return
    }
    if (next !== null) {
      e.preventDefault()
      cards[next].focus()
      pick(dates[next])
    }
  }

  const customSelected = !!selected && !dates.includes(selected)

  return (
    <div className="landing landing--dates" ref={root} data-testid="landing">
      <LandingArt />
      {/* Not inside a [data-reveal] wrapper: the GSAP transform would become the
          containing block for the mosaic's absolute positioning. CSS handles its fade. */}
      <MissionMosaic />

      <div className="landing-content">
        <div className="landing-eyebrow" data-reveal>
          {LANDING.eyebrow}
        </div>
        <h1 className="landing-title" data-reveal>
          {LANDING.title} <em>{LANDING.titleAccent}</em>
          <span className="landing-demo">DEMO</span>
        </h1>
        <p className="landing-sub" data-reveal>
          {LANDING.sub}
        </p>

        <form className="date-form" onSubmit={submit} noValidate data-reveal data-testid="date-form">
          <div className="date-head">
            <span className="date-shipto">{LANDING.shipTo}</span>
            <span className="date-schedule" data-testid="date-schedule-label">
              {LANDING.scheduleLabel}
            </span>
          </div>

          <div className="date-list" role="radiogroup" aria-label={LANDING.shipTo} ref={listRef} data-testid="date-list">
            {dates.map((iso, i) => {
              const p = dateParts(iso)
              const isSel = selected === iso
              return (
                <button
                  key={iso}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  aria-label={formatLong(iso)}
                  className={`date-card ${isSel ? 'is-selected' : ''}`}
                  tabIndex={isSel || (!selected && i === 0) || (customSelected && i === 0) ? 0 : -1}
                  onClick={() => pick(iso)}
                  onKeyDown={(e) => onCardKey(e, i)}
                  data-date-card
                  data-iso={iso}
                  data-testid="date-card"
                >
                  <span className="date-month">{p.month}</span>
                  <span className="date-day">{p.day}</span>
                  <span className="date-weekday">{p.weekday}</span>
                </button>
              )
            })}
          </div>

          <div className="date-custom">
            {!showCustom ? (
              <button type="button" className="link-quiet" onClick={() => setShowCustom(true)} data-testid="date-other">
                {LANDING.pickOther}
              </button>
            ) : (
              <label className="date-custom-field">
                <span>{LANDING.pickOther}</span>
                <input
                  type="date"
                  min={minCustom}
                  value={custom}
                  onChange={(e) => onCustom(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'date-error' : undefined}
                  data-testid="date-input"
                  autoFocus
                />
              </label>
            )}
          </div>

          <button className="btn btn-primary date-begin" type="submit" data-testid="date-begin">
            {LANDING.begin}
            {selected && <span className="date-begin-sel">{formatLong(selected)}</span>}
            <span aria-hidden="true">→</span>
          </button>
          <div className="zip-error" id="date-error" role="alert" aria-live="polite" data-testid="date-error">
            {error}
          </div>
        </form>

        <div className="landing-secondary" data-reveal>
          <button type="button" className="link-quiet" onClick={() => exit(onExplore)} data-testid="explore">
            {LANDING.explore}
          </button>
        </div>
        <p className="landing-footnote" data-reveal>
          {LANDING.footnote}
        </p>
      </div>

      <p className="landing-disclaimer">{DISCLAIMER}</p>
    </div>
  )
}
