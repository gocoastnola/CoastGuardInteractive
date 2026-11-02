# AGENTS.md — durable rules for anyone (human or AI) working in this repo

## Scope guardrails

- Geography is **CONUS + Alaska + Puerto Rico + Guam**. Do not add world-map features or other territories without an explicit owner decision recorded in DECISIONS.md.
- Keep the disclaimer line on the landing page and in README/index.html meta. Never imply affiliation with or endorsement by the U.S. Coast Guard.
- Spend **no money**, create **no external accounts**, add **no API keys**, and do **no public hosting** unless the owner explicitly asks.

## Demo-data labelling (mandatory)

- Every record in `src/data/units.json` carries `contentReviewStatus`, `sourceUrls`, `lastVerified`. New or edited records default to `"demo-unverified"`, `[]`, `null`.
- Only the owner flips a record to `"verified"`, and only with at least one public `sourceUrls` entry and a `lastVerified` date. Log the source in SOURCES.md.
- Do not write dramatic or specific historical claims into placeholder text. Neutral, short, labelled "Demo".
- `npm run validate:data` must pass before every commit that touches data.

## Secrets & security

- Nothing secret ever enters the client bundle. Only `VITE_*` variables are exposed to the browser; anything sensitive (e.g. a future `ELEVENLABS_API_KEY`) is server-side only and lives in `.env*` files that are git-ignored.
- `.env.example` lists placeholder **names** only. Never commit `.env`, `.env.local`, tokens, or credentials.
- See SECURITY.md for data sourcing guidelines and handling of official insignia.

## Ports & processes

- Dev server: `127.0.0.1:5174` (`npm run dev`). Preview: `5175`.
- **Port 4173 belongs to another app on this machine. Never bind to it or kill its process.**
- Do not touch other projects on the Mac mini.

## Engineering conventions

- Stack is fixed: Vite + React 18 + TypeScript, MapLibre GL JS, GSAP, plain CSS with custom properties (no Tailwind), Vitest, Playwright. Changes to the stack go through DECISIONS.md.
- Map camera animations use MapLibre (`flyTo`/`easeTo`/`fitBounds`); GSAP is for DOM/UI only. Both must honour `prefers-reduced-motion` via `src/lib/motion.ts` (`jumpTo` / instant).
- No hot-linked fonts, images, or scripts. Bundle assets and record their licenses in ASSET_LICENSES.md.
- Keep `npm run build`, `npm test`, and `npm run test:e2e` green. Add a test when you add a behaviour.
- GSAP + React StrictMode: clean up tweens with `revert()` (not `kill()`) so `from()` values don't leak between double-invoked effects.
- Do not use or imply official USCG endorsement. Maintain the disclaimer on the landing page and in docs.

## Documentation update rule

When you change behaviour, update the matching doc in the same commit:

| Change | Update |
| --- | --- |
| Feature works / verified | PROGRESS.md |
| Stack or architectural choice | DECISIONS.md |
| Phase scope or ordering | PLANS.md |
| New dependency / asset | ASSET_LICENSES.md |
| Data record verified | SOURCES.md |
| Security or data sourcing change | SECURITY.md |

Commits touching data must also pass `npm run validate:data`.
