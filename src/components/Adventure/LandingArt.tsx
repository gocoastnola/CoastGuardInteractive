/** Decorative hero background (grid + radar rings + swells). Project-authored SVG, no external assets. */
export function LandingArt() {
  return (
    <>
      <div className="landing-grid" />
      <svg className="landing-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="lg-glow" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#lg-glow)" />
        {[180, 300, 430, 580].map((r, i) => (
          <circle
            key={r}
            className="landing-ring"
            cx="800"
            cy="520"
            r={r}
            fill="none"
            stroke={i % 2 ? '#f3c25a' : '#22d3ee'}
            strokeOpacity={0.18 - i * 0.03}
            strokeWidth={1}
            strokeDasharray={i === 1 ? '6 10' : undefined}
          />
        ))}
        <path
          d="M0 700 C 200 660, 300 760, 520 720 S 900 640, 1100 700 S 1450 760, 1600 690"
          fill="none"
          stroke="#67e8f9"
          strokeOpacity="0.14"
          strokeWidth="2"
        />
        <path
          d="M0 760 C 240 720, 360 820, 600 780 S 980 700, 1200 760 S 1500 820, 1600 750"
          fill="none"
          stroke="#f3c25a"
          strokeOpacity="0.1"
          strokeWidth="1.5"
        />
      </svg>
    </>
  )
}
