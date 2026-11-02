/**
 * Journey state machine (plain reducer — no library).
 *
 *   dateEntry ─START─▶ act1 ─ACT1_DONE/SKIP─▶ orders(slot) ─CHOOSE─▶ act2
 *     ▲                                                               │ ACT2_DONE / SKIP
 *     │                                                               ▼
 *     │                          explore ◀─PATROL_DONE/SKIP── patrol ◀─SHIP_INTRO_DONE── shipIntro
 *     └──────────────────────────── RESTART ◀──────────────────────────────┘
 *   dateEntry ──FREE_EXPLORE──▶ explore          (the quiet "or explore the map" link; no journey data)
 *
 * `dateEntry` is the "Pick your basic training date" landing (owner decision,
 * DECISIONS.md — replaced the ZIP landing; ZIP code retained but unused).
 * `act1` is the Cape May countdown + 8-week training progression.
 * `orders` renders the assignment slot machine (always lands on USCGC Polar
 * Star — owner decision, DECISIONS.md). `shipIntro` is the Polar Star mission
 * card; `patrol` is the cinematic world patrol. `idle` exists only before the
 * app has decided which entry to show; the UI starts straight in `dateEntry`.
 */

export type Phase = 'idle' | 'dateEntry' | 'act1' | 'orders' | 'act2' | 'shipIntro' | 'patrol' | 'explore'

export interface JourneyState {
  phase: Phase
  /** Chosen basic-training ship date (ISO `YYYY-MM-DD`, local), null before START. */
  shipDate: string | null
  /** Unit ids offered in the orders board. */
  orderIds: string[]
  /** Unit id the user reported aboard to. */
  firstUnitId: string | null
  /** True once Act 1 completed via Skip (used to shorten Act 2 defaults). */
  skipped: boolean
}

export type JourneyAction =
  | { type: 'START'; shipDate: string; orderIds: string[] }
  | { type: 'ACT1_DONE' }
  | { type: 'SKIP_ACT' }
  | { type: 'CHOOSE_ORDER'; unitId: string }
  | { type: 'ACT2_DONE' }
  | { type: 'SHIP_INTRO_DONE' }
  | { type: 'PATROL_DONE' }
  | { type: 'FREE_EXPLORE' }
  | { type: 'RESTART' }

export const INITIAL_JOURNEY: JourneyState = {
  phase: 'dateEntry',
  shipDate: null,
  orderIds: [],
  firstUnitId: null,
  skipped: false,
}

export function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'dateEntry' && state.phase !== 'idle') return state
      return { ...INITIAL_JOURNEY, phase: 'act1', shipDate: action.shipDate, orderIds: action.orderIds }
    case 'ACT1_DONE':
      return state.phase === 'act1' ? { ...state, phase: 'orders' } : state
    case 'SKIP_ACT':
      if (state.phase === 'act1') return { ...state, phase: 'orders', skipped: true }
      if (state.phase === 'act2') return { ...state, phase: 'shipIntro', skipped: true }
      if (state.phase === 'patrol') return { ...state, phase: 'explore', skipped: true }
      return state
    case 'CHOOSE_ORDER':
      if (state.phase !== 'orders' || !state.orderIds.includes(action.unitId)) return state
      return { ...state, phase: 'act2', firstUnitId: action.unitId }
    case 'ACT2_DONE':
      return state.phase === 'act2' ? { ...state, phase: 'shipIntro' } : state
    case 'SHIP_INTRO_DONE':
      return state.phase === 'shipIntro' ? { ...state, phase: 'patrol' } : state
    case 'PATROL_DONE':
      return state.phase === 'patrol' ? { ...state, phase: 'explore' } : state
    case 'FREE_EXPLORE':
      return { ...INITIAL_JOURNEY, phase: 'explore' }
    case 'RESTART':
      return { ...INITIAL_JOURNEY, phase: 'dateEntry' }
    default:
      return state
  }
}

/** True while a cinematic act owns the screen (HUD hidden; Esc quietly advances). */
export function isCinematic(phase: Phase): boolean {
  return phase === 'act1' || phase === 'act2' || phase === 'shipIntro' || phase === 'patrol'
}
