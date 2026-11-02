import { COUNTDOWN, fill } from '../../journey/copy'
import { formatShort, TRAINING_WEEKS } from '../../journey/dates'

interface Props {
  /** Whole days remaining until the ship date (parent drives this down from today's count). */
  days: number
  /** Days from today to the ship date at the start (bar denominator). */
  totalDays: number
  shipDate: string
  /** 0..8 — fractional weeks of basic training completed; `null` while still counting down. */
  weeks: number | null
}

function shipsLabel(days: number): string {
  if (days <= 0) return COUNTDOWN.shipsToday
  if (days === 1) return COUNTDOWN.shipsTomorrow
  return fill(COUNTDOWN.shipsIn, { days: String(days) })
}

/**
 * Act 1 readout. Phase A: "Ships in 23 days · Tue, Nov 3" with a thin bar that
 * drains as the days tick down. Phase B: Week 1 → Week 8 training bar that fills.
 */
export function DaysCounter({ days, totalDays, shipDate, weeks }: Props) {
  const training = weeks !== null
  const weekNum = training ? Math.min(TRAINING_WEEKS, Math.max(1, Math.ceil(weeks))) : 0
  const pct = training ? Math.min(1, Math.max(0, weeks / TRAINING_WEEKS)) : totalDays > 0 ? 1 - Math.min(1, Math.max(0, days / totalDays)) : 1
  const graduated = training && weeks >= TRAINING_WEEKS
  return (
    <div className={`days ${training ? 'is-training' : ''}`} data-testid="days-counter" aria-live="off">
      {!training ? (
        <div className="days-readout">
          <span className="days-num" data-testid="days-value">
            {shipsLabel(Math.max(0, Math.round(days)))}
          </span>
          <span className="days-sep" aria-hidden="true">
            ·
          </span>
          <span className="days-date" data-testid="ship-date">
            {formatShort(shipDate)}
          </span>
        </div>
      ) : (
        <div className="days-readout">
          <span className="days-num" data-testid="week-value">
            {graduated ? COUNTDOWN.graduated : fill(COUNTDOWN.week, { n: String(weekNum) })}
          </span>
          <span className="days-sep" aria-hidden="true">
            ·
          </span>
          <span className="days-date">{COUNTDOWN.training}</span>
        </div>
      )}
      <div
        className="weeks-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
        aria-label={training ? COUNTDOWN.training : shipsLabel(days)}
        data-testid="weeks-bar"
      >
        <span className="weeks-fill" style={{ transform: `scaleX(${pct})` }} />
        {training && (
          <span className="weeks-ticks" aria-hidden="true">
            {Array.from({ length: TRAINING_WEEKS }, (_, i) => (
              <i key={i} className={i < weekNum ? 'is-done' : ''} />
            ))}
          </span>
        )}
      </div>
      {training && (
        <div className="weeks-labels" aria-hidden="true">
          <span>Week 1</span>
          <span>Week {TRAINING_WEEKS}</span>
        </div>
      )}
    </div>
  )
}
