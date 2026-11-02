import type { Unit } from '../data/schema'
import { hueFor } from '../lib/units'

/**
 * Procedural SVG header placeholder — no external images. Varies by unit id
 * so every panel feels distinct while remaining clearly a placeholder.
 */
export function HeaderArt({ unit }: { unit: Unit }) {
  const hue = hueFor(unit.id)
  const gid = `g-${unit.id}`
  const stroke = unit.unitType === 'Sector' ? '#f3c25a' : '#22d3ee'
  return (
    <svg viewBox="0 0 440 200" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Placeholder header art">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 45% 18%)`} />
          <stop offset="55%" stopColor="#0d1526" />
          <stop offset="100%" stopColor={`hsl(${(hue + 60) % 360} 40% 14%)`} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="75%" cy="30%" r="60%">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="440" height="200" fill={`url(#${gid})`} />
      <rect width="440" height="200" fill={`url(#${gid}-glow)`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M-20 ${120 + i * 16} C 90 ${100 + i * 14}, 160 ${150 + i * 10}, 250 ${125 + i * 12} S 400 ${105 + i * 14}, 470 ${130 + i * 10}`}
          fill="none"
          stroke={i % 2 ? '#f3c25a' : '#67e8f9'}
          strokeOpacity={0.22 - i * 0.035}
          strokeWidth="1.2"
        />
      ))}
      <g transform="translate(330 70)" opacity="0.9">
        <circle r="34" fill="none" stroke={stroke} strokeOpacity="0.35" />
        <circle r="22" fill="none" stroke={stroke} strokeOpacity="0.5" strokeDasharray="4 6" />
        <circle r="5" fill={stroke} />
        <path d="M0 -34 V34 M-34 0 H34" stroke={stroke} strokeOpacity="0.25" />
      </g>
      <text x="16" y="34" fontFamily="Inter, system-ui" fontSize="11" letterSpacing="3" fill="rgba(255,255,255,0.45)">
        {unit.district ? `DISTRICT ${unit.district.replace('D', '')}` : 'U.S. COAST GUARD (DEMO)'}
      </text>
    </svg>
  )
}
