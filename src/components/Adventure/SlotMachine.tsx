import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { Unit } from '../../data/schema'
import { prefersReducedMotion } from '../../lib/motion'
import { sound } from '../../lib/audio'
import { ORDERS_RISE_SECONDS } from '../../lib/audioScore'
import { SLOT } from '../../journey/copy'
import { POLAR_STAR_ID } from '../../journey/patrol'
import { SoundToggle } from './SoundToggle'

interface Props {
  units: Unit[]
  /** Fires when the recruit clicks "Report aboard" after the reel lands. */
  onReport: (unitId: string) => void
}

const ROW_H = 72 // must match .slot-row height in global.css
const LOOPS = 3 // full passes through the reel before landing
const SPIN_S = ORDERS_RISE_SECONDS

/**
 * "Orders are in" — the assignment board. A vertical reel of unit names
 * spins, decelerates, and always lands on USCGC Polar Star (owner decision,
 * DECISIONS.md). The spin button doubles as the audio-enable gesture.
 */
export function SlotMachine({ units, onReport }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const spinTween = useRef<gsap.core.Tween | null>(null)
  const [state, setState] = useState<'ready' | 'spinning' | 'landed'>('ready')
  const reduced = prefersReducedMotion()

  /** Reel order: stable shuffle of unit names with Polar Star somewhere inside. */
  const reel = useMemo(() => {
    const names = units.map((u) => ({ id: u.id, name: u.name, place: `${u.city}, ${u.state}` }))
    // deterministic rotation so the reel reads varied without RNG
    const rotated = [...names.slice(5), ...names.slice(0, 5)]
    const idx = rotated.findIndex((n) => n.id === POLAR_STAR_ID)
    if (idx === -1) throw new Error('Polar Star missing from units data')
    return { items: rotated, target: idx }
  }, [units])

  // Rows rendered: LOOPS + 1 copies so the deceleration has room to land.
  const rows = useMemo(() => {
    const copies: Array<{ id: string; name: string; place: string; key: string }> = []
    for (let c = 0; c <= LOOPS; c++) {
      reel.items.forEach((item, i) => copies.push({ ...item, key: `${c}-${i}` }))
    }
    return copies
  }, [reel])

  useEffect(() => {
    if (!root.current || reduced) return
    const ctx = gsap.context(() => {
      gsap.from('[data-slot-reveal]', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  useEffect(() => () => {
    spinTween.current?.kill()
    sound.stopSlotSpin()
  }, [])

  // Animate the result after React has mounted it, not in the reel's completion callback.
  useEffect(() => {
    if (state !== 'landed' || reduced || !root.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.slot-frame', { boxShadow: '0 0 0 2px rgba(243,194,90,0.0)' }, {
        boxShadow: '0 0 60px 6px rgba(243,194,90,0.35)', duration: 0.5, yoyo: true, repeat: 1,
      })
      gsap.fromTo('.slot-landed-card', { opacity: 0, y: 26, scale: 0.96 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.6)', delay: 0.15,
      })
    }, root)
    return () => ctx.revert()
  }, [state, reduced])

  const spin = () => {
    if (state !== 'ready') return
    sound.enable()
    sound.ambient()
    if (reduced) {
      sound.lock()
      setState('landed')
      return
    }
    setState('spinning')
    if (!strip.current) {
      setState('landed')
      return
    }
    const finalIndex = LOOPS * reel.items.length + reel.target
    const proxy = { i: 0 }
    sound.whoosh()
    sound.slotSpin()
    spinTween.current = gsap.to(proxy, {
      i: finalIndex,
      duration: SPIN_S,
      ease: 'power4.out',
      onUpdate: () => {
        const y = -proxy.i * ROW_H
        gsap.set(strip.current, { y })
      },
      onComplete: () => {
        sound.lock()
        setState('landed')
      },
    })
  }

  // Quiet Esc: resolve instantly, no overlay buttons (owner preference).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (state === 'ready' || state === 'spinning') {
        spinTween.current?.kill()
        sound.stopSlotSpin()
        setState('landed')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state])

  const landed = state === 'landed'
  const target = reel.items[reel.target]

  return (
    <div className={`slot long-watch-orders ${landed ? 'has-assignment' : ''}`} ref={root} role="dialog" aria-labelledby="slot-title" data-testid="slot">
      <SoundToggle />
      <div className="slot-head" data-slot-reveal>
        <p className="scene-kicker"><span>03</span> The next chapter</p>
        <div className="orders-eyebrow">{SLOT.demoNote}</div>
        <h2 id="slot-title" className="orders-title">
          {SLOT.title}
        </h2>
        <p className="orders-sub">{SLOT.sub}</p>
      </div>

      <div className="orders-record" data-slot-reveal><span>UNIT ASSIGNMENT</span><span>ILLUSTRATIVE / 001</span></div>
      <div className={`slot-frame ${landed ? 'is-landed' : ''} ${state === 'spinning' ? 'is-spinning' : ''}`} data-slot-reveal>
        <div className="slot-window" style={{ height: ROW_H }}>
          {landed ? (
            <div key="final" className="slot-row is-final" data-testid="slot-final">
              <span className="slot-name">{target.name}</span>
              <span className="slot-place">{target.place}</span>
            </div>
          ) : (
            <div key="reel" className="slot-strip" ref={strip} data-testid="slot-strip">
              {rows.map((r) => (
                <div className="slot-row" key={r.key} style={{ height: ROW_H }}>
                  <span className="slot-name">{r.name}</span>
                  <span className="slot-place">{r.place}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="slot-pointer" aria-hidden="true">▸</div>
        <div className="slot-pointer slot-pointer--right" aria-hidden="true">◂</div>
      </div>

      {state === 'ready' && (
        <button className="btn btn-primary slot-spin" onClick={spin} data-slot-reveal data-testid="slot-spin">
          {SLOT.spin} <span aria-hidden="true">→</span>
        </button>
      )}
      {state === 'spinning' && (
        <p className="slot-status" aria-live="polite">
          {SLOT.spinning}
        </p>
      )}
      {landed && (
        <div className="slot-landed-card" data-testid="slot-landed">
          <div className="slot-landed-eyebrow">{SLOT.landedEyebrow}</div>
          <div className="slot-landed-name">{target.name}</div>
          <div className="slot-landed-place">{target.place}</div>
          <button
            className="btn btn-primary"
            onClick={() => {
              sound.enable()
              sound.whoosh()
              onReport(POLAR_STAR_ID)
            }}
            data-testid="slot-report"
          >
            {SLOT.report} <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  )
}
