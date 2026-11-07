import { useEffect, useRef, useState, type FormEvent } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../lib/motion'
import { LANDING } from '../../journey/copy'
import { isValidZipFormat, lookupZip, type ZipResult } from '../../journey/zips'
import { LandingArt } from './LandingArt'
import { sound } from '../../lib/audio'
import { MissionMosaic } from './MissionMosaic'

export const DISCLAIMER =
  'Independent educational demonstration. Not affiliated with or endorsed by the U.S. Coast Guard. Demo data pending verification.'

interface Props {
  /** Resolved hometown; the parent starts Act 1 after the exit tween completes. */
  onBegin: (home: ZipResult) => void
  /** Quiet secondary path into free-explore mode. */
  onExplore: () => void
  /** Pre-fill (e.g. after "Restart adventure"). */
  initialZip?: string
}

/**
 * LEGACY — RETAINED BUT UNUSED. The live landing is DateEntry.tsx ("Pick your basic
 * training date", owner decision 2026-10-20, DECISIONS.md). Kept, with zips.ts and
 * the ZIP table, for a possible optional hometown step later.
 *
 * "Start Your Adventure" — dark nautical hero + a 5-digit ZIP field.
 * The ZIP table is fetched lazily on the first submit (see journey/zips.ts).
 */
export function ZipEntry({ onBegin, onExplore, initialZip = '' }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const exiting = useRef(false)
  const [zip, setZip] = useState(initialZip)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
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

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || exiting.current) return
    const value = zip.trim()
    if (!isValidZipFormat(value)) {
      setError(LANDING.zipErrors.format)
      input.current?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const home = await lookupZip(value)
      if (!home) {
        setError(LANDING.zipErrors.unknown)
        input.current?.select()
        return
      }
      sound.enable()
      sound.chime()
      exit(() => onBegin(home))
    } catch (err) {
      console.warn('[adventure] ZIP lookup failed:', err)
      setError(LANDING.zipErrors.offline)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="landing" ref={root} data-testid="landing">
      <LandingArt />
      {/* Not inside a [data-reveal] wrapper: the GSAP transform would become the
          containing block for the mosaic's absolute positioning. CSS handles its fade. */}
      <MissionMosaic />

      <div className="landing-content">
        <div className="landing-eyebrow" data-reveal>
          {LANDING.eyebrow}
        </div>
        <h1 className="landing-title" data-reveal>
          Enter your ZIP code <em>and start your journey</em>
          <span className="landing-demo">DEMO</span>
        </h1>
        <p className="landing-sub" data-reveal>
          {LANDING.zipSub}
        </p>

        <form className="zip-form" onSubmit={submit} noValidate data-reveal data-testid="zip-form">
          <label className="zip-field">
            <span className="sr-only">{LANDING.zipLabel}</span>
            <input
              ref={input}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder={LANDING.zipPlaceholder}
              value={zip}
              aria-invalid={!!error}
              aria-describedby={error ? 'zip-error' : 'zip-footnote'}
              onChange={(e) => {
                setZip(e.target.value.replace(/\D/g, '').slice(0, 5))
                if (error) setError(null)
              }}
              data-testid="zip-input"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy} data-testid="zip-begin">
            {busy ? LANDING.checking : LANDING.begin}
            {!busy && <span aria-hidden="true">→</span>}
          </button>
        </form>
        <div className="zip-error" id="zip-error" role="alert" aria-live="polite" data-testid="zip-error">
          {error}
        </div>

        <div className="landing-secondary" data-reveal>
          <button type="button" className="link-quiet" onClick={() => { sound.enable(); exit(onExplore) }} data-testid="explore">
            {LANDING.explore}
          </button>
        </div>
        <p className="landing-footnote" id="zip-footnote" data-reveal>
          {LANDING.zipFootnote}
        </p>
      </div>

      <p className="landing-disclaimer">{DISCLAIMER}</p>
    </div>
  )
}
