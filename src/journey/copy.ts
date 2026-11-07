/**
 * All adventure copy in one place. Edit the words here.
 * `{miles}` is replaced with the rounded, comma-formatted distance.
 * `{shipDate}` / `{gradDate}` / `{days}` come from the chosen ship date (journey/dates.ts).
 * `{unit}` is replaced with the chosen unit's name.
 */

export const LANDING = {
  eyebrow: 'CoastGuard Interactive',
  title: 'Pick your',
  titleAccent: 'basic training date',
  sub: 'Choose the day you ship to Training Center Cape May. We count down the clock, march you through eight weeks, and send you to your first unit.',
  scheduleLabel: 'Demo schedule — illustrative dates',
  shipTo: 'Ship dates to Training Center Cape May',
  pickOther: 'Pick a different date',
  begin: 'Start my journey',
  explore: 'or explore the map',
  errors: {
    none: 'Pick a ship date to begin.',
    invalid: 'Enter a valid date.',
    past: 'Pick a date that is still ahead of you.',
  },
  footnote: 'Ship dates are demo placeholders — real Cape May class dates are not verified. Basic training shown as 8 weeks (demo).',
  /** Retained for the (unused) ZIP landing — see DECISIONS.md. */
  zipSub: 'Your journey starts at home. Watch the miles to Cape May, conquer eight weeks of boot camp, receive your orders, and see the world aboard Polar Star.',
  zipLabel: 'Your hometown ZIP code',
  zipPlaceholder: '5-digit ZIP',
  checking: 'Checking…',
  zipErrors: {
    format: 'Enter a 5-digit U.S. ZIP code.',
    unknown: 'We don’t know that ZIP. Try a neighbouring one.',
    offline: 'Could not load the ZIP table. Check your connection and try again.',
  },
  zipFootnote: 'ZIP centroids from the U.S. Census 2020 ZCTA Gazetteer (public domain) · city-level accuracy.',
} as const

/**
 * Act 1 — "Report to Cape May". `{shipDate}` / `{gradDate}` are short dates
 * ("Tue, Nov 3"); gradDate = shipDate + 8 weeks (demo-unverified, SOURCES.md).
 */
export const ACT1_BEATS = [
  'You picked your date. Now the clock is real.',
  'Report to Training Center Cape May — {shipDate}.',
  'Eight weeks. Every one of them earned.',
  'Pushed harder than you thought you could go.',
  'Graduation: {gradDate}. Stronger. Faster. Sharper.',
] as const

/** Legacy ZIP-era Act 1 beats (unused; kept with the ZIP landing — DECISIONS.md). */
export const ACT1_ZIP_BEATS = [
  'Everyone starts somewhere. You start here.',
  '{miles} miles to Training Center Cape May.',
  'Your hometown is behind you. Your future is ahead.',
  'Cape May, New Jersey. This is where it begins.',
  'Eight weeks of training await. Show them what you are made of.',
] as const

/** Days counter / training progression readout. */
export const COUNTDOWN = {
  shipsIn: 'Ships in {days} days',
  shipsTomorrow: 'Ships tomorrow',
  shipsToday: 'Ships today',
  week: 'Week {n}',
  training: 'Basic training · Cape May',
  graduated: 'Graduated',
} as const

export const ACT2_BEATS = ['Orders in hand.', '{miles} miles to {unit}.', 'Report aboard.'] as const

/** The assignment slot machine (always lands on Polar Star — DECISIONS.md). */
export const SLOT = {
  eyebrow: 'Boot camp graduation',
  title: 'Orders are in',
  sub: 'One envelope. One ship. The board decides where your story starts.',
  spin: 'Open your orders',
  spinning: 'The board is deciding…',
  landedEyebrow: 'Your first unit',
  report: 'Report aboard',
  demoNote: 'Demo: assignments are illustrative, not real orders.',
} as const

/** Polar Star mission card (demo copy — owner will verify; see SOURCES.md). */
export const SHIP = {
  eyebrow: 'Your first unit',
  name: 'USCGC Polar Star',
  hull: 'WAGB-10',
  klass: 'Heavy Polar Icebreaker',
  homeport: 'Seattle, Washington',
  summary:
    'The nation’s only operational heavy icebreaker. Every year she sails south to break a channel through miles of Antarctic ice so an entire research continent can be resupplied — a mission no other ship in America can do.',
  missions: [
    'Antarctic icebreaking · Operation Deep Freeze',
    'Scientific & logistics support',
    'Search and rescue in polar waters',
    'National presence at the bottom of the world',
  ],
  begin: 'Set sail — your first patrol',
  demoNote: 'Demo: ship facts are illustrative pending verification.',
} as const

/** Patrol overlay copy. */
export const PATROL = {
  eyebrow: 'First patrol',
  title: 'Around the bottom of the world',
  totalLabel: 'patrol miles',
  arrived: 'Port call',
  underway: 'Underway — {port}',
  canalTitle: 'Transiting the Panama Canal',
  done: 'Welcome home, shipmate.',
  continue: 'Continue',
} as const

export const LABELS = {
  home: 'Your hometown',
  bootCamp: 'Boot camp',
  firstUnit: 'Your first unit',
  milesTo: 'miles to {place}',
  skip: 'Skip',
  continue: 'Continue',
  ordersTitle: 'Orders are in',
  ordersSub: 'Three billets. One decision. Pick where you report first.',
  reportAboard: 'Report aboard',
  fromCapeMay: 'from Cape May',
  ribbon: 'Your first unit',
  restart: 'Restart adventure',
  demoNote: 'Demo: assignments are illustrative, not real orders.',
} as const

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`)
}
