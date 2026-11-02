import { forwardRef } from 'react'
import { formatMiles } from '../../journey/arc'
import { fill, LABELS } from '../../journey/copy'

interface Props {
  miles: number
  total: number
  place: string
}

/** Live-ticking distance readout with a thin progress bar. Parent drives `miles`. */
export const MilesCounter = forwardRef<HTMLDivElement, Props>(function MilesCounter({ miles, total, place }, ref) {
  const pct = total > 0 ? Math.max(0, Math.min(1, miles / total)) : 1
  return (
    <div className="miles" ref={ref} data-testid="miles-counter" aria-live="off">
      <div className="miles-readout">
        <span className="miles-num" data-testid="miles-value">
          {formatMiles(miles)}
        </span>
        <span className="miles-label">{fill(LABELS.milesTo, { place })}</span>
      </div>
      <div className="miles-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
        <span style={{ transform: `scaleX(${pct})` }} />
      </div>
    </div>
  )
})
