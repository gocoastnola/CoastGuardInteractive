import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { UNIT_TYPES, type Unit, type UnitType } from '../data/schema'
import { UNIT_TYPE_COLORS, filterUnits } from '../lib/units'
import { prefersReducedMotion } from '../lib/motion'
import { IconClose, IconSearch } from './Icons'

interface Props {
  units: Unit[]
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}

/** Searchable, filterable unit list. Selecting an item behaves exactly like clicking its marker. */
export function Directory({ units, selectedId, onSelect, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [types, setTypes] = useState<UnitType[]>([])

  const presentTypes = useMemo(() => UNIT_TYPES.filter((t) => units.some((u) => u.unitType === t)), [units])
  const results = useMemo(() => filterUnits(units, { text, types }), [units, text, types])

  useEffect(() => {
    input.current?.focus({ preventScroll: true })
    if (!root.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(
      root.current,
      { x: -24, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
    )
    return () => {
      tween.revert()
    }
  }, [])

  const toggleType = (t: UnitType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  return (
    <div className="directory" ref={root} role="region" aria-label="Unit directory" data-testid="directory">
      <div className="directory-head">
        <h2>
          Directory
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Close directory">
            <IconClose />
          </button>
        </h2>
        <label className="search">
          <span className="sr-only">Search units</span>
          <IconSearch />
          <input
            ref={input}
            type="search"
            placeholder="Search name, city, type…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            data-testid="directory-search"
          />
        </label>
        <div className="filters" role="group" aria-label="Filter by unit type">
          {presentTypes.map((t) => (
            <button
              key={t}
              className="chip"
              style={{ ['--c' as string]: UNIT_TYPE_COLORS[t] }}
              aria-pressed={types.includes(t)}
              onClick={() => toggleType(t)}
            >
              {t}
            </button>
          ))}
          {types.length > 0 && (
            <button className="chip" onClick={() => setTypes([])}>
              Clear
            </button>
          )}
        </div>
      </div>

      <ul className="directory-list">
        {results.map((u) => (
          <li key={u.id}>
            <button
              className="directory-item"
              style={{ ['--c' as string]: UNIT_TYPE_COLORS[u.unitType] }}
              aria-current={u.id === selectedId}
              onClick={() => onSelect(u.id)}
              data-testid="directory-item"
            >
              <span className="dot" aria-hidden="true" />
              <span>
                <strong>{u.name}</strong>
                <span>
                  {u.city}, {u.state}
                </span>
              </span>
              <span className="type">{u.unitType}</span>
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="directory-empty">No units match “{text}”.</li>}
      </ul>
      <div className="directory-foot">
        {results.length} of {units.length} units · demo data, unverified
      </div>
    </div>
  )
}
