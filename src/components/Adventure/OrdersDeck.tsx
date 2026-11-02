import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { OrderCard } from '../../journey/orders'
import { formatMiles } from '../../journey/arc'
import { LABELS } from '../../journey/copy'
import { UNIT_TYPE_COLORS } from '../../lib/units'
import { prefersReducedMotion } from '../../lib/motion'

interface Props {
  orders: OrderCard[]
  onChoose: (unitId: string) => void
}

/** "Orders are in" — three deterministic unit cards; pick one to report aboard. */
export function OrdersDeck({ orders, onChoose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const chosen = useRef(false)

  useEffect(() => {
    first.current?.focus({ preventScroll: true })
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.orders-head', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      gsap.fromTo(
        '.order-card',
        { opacity: 0, y: 40, rotateX: -12 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12, delay: 0.25 },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  const choose = (id: string) => {
    if (chosen.current) return
    chosen.current = true
    if (!root.current || prefersReducedMotion()) {
      onChoose(id)
      return
    }
    const cards = root.current.querySelectorAll<HTMLElement>('.order-card')
    gsap.to(cards, {
      opacity: (_i: number, el: HTMLElement) => (el.dataset.unitId === id ? 1 : 0),
      y: (_i: number, el: HTMLElement) => (el.dataset.unitId === id ? -10 : 30),
      scale: (_i: number, el: HTMLElement) => (el.dataset.unitId === id ? 1.04 : 0.96),
      duration: 0.45,
      ease: 'power2.in',
      stagger: 0.03,
    })
    gsap.to(root.current, { opacity: 0, duration: 0.5, delay: 0.5, ease: 'power2.inOut', onComplete: () => onChoose(id) })
  }

  return (
    <div className="orders" ref={root} role="dialog" aria-labelledby="orders-title" data-testid="orders">
      <div className="orders-head">
        <div className="orders-eyebrow">{LABELS.demoNote}</div>
        <h2 id="orders-title" className="orders-title">
          {LABELS.ordersTitle}
        </h2>
        <p className="orders-sub">{LABELS.ordersSub}</p>
      </div>
      <div className="orders-deck">
        {orders.map(({ unit, coast, milesFromCapeMay }, i) => (
          <button
            key={unit.id}
            ref={i === 0 ? first : undefined}
            className="order-card"
            style={{ ['--c' as string]: UNIT_TYPE_COLORS[unit.unitType] }}
            data-unit-id={unit.id}
            data-testid="order-card"
            onClick={() => choose(unit.id)}
          >
            <span className="order-top">
              <span className="badge">{unit.unitType}</span>
              <span className="order-coast">{coast}</span>
            </span>
            <span className="order-name">{unit.name}</span>
            <span className="order-city">
              {unit.city}, {unit.state}
            </span>
            <span className="order-summary">{unit.missionSummary}</span>
            <span className="order-foot">
              <span className="order-miles">
                <strong>{formatMiles(milesFromCapeMay)}</strong> mi {LABELS.fromCapeMay}
              </span>
              <span className="order-cta">
                {LABELS.reportAboard} <span aria-hidden="true">→</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
