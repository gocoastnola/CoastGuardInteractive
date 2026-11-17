# SECURITY.md

## Client-side secrets: none, ever

- The site is a static Vite bundle. Only `VITE_*` environment variables reach the browser; they must only ever hold **public** values (currently just the keyless map style URL).
- `ELEVENLABS_API_KEY` in `.env.example` is a **placeholder name** for a future server-side step. It is intentionally not `VITE_`-prefixed. Client code must never read it.
- `.env`, `.env.local`, `.env.*` are git-ignored. `.env.example` is the only env file in the repo and contains names, not values.
- Review `git diff --cached` for tokens before every commit. Never paste credentials into chat, issues, commit messages or logs.

## Server-side logic separation (plan)

Phase 1 has no backend. When narration audio or any keyed service is introduced:

1. A separate `server/` package (or offline script) performs API calls using secrets from the host environment or a secrets manager.
2. It writes **static outputs** (e.g. `public/narration/<unit-id>.mp3`) that the client loads by URL — the `narrationAudio` field in `units.json`.
3. The client bundle continues to have zero secrets. Current public requests include map resources and remotely hosted photographic assets; any future keyed API must remain server-side.
4. Outputs are generated locally; nothing is hosted publicly without an explicit owner decision.

## Dependency hygiene

- `npm audit` was clean (0 vulnerabilities) at Phase 1 commit. Re-run on every dependency change.
- Pin major versions; review MapLibre/Vite release notes before upgrades.

## Privacy

- No analytics or application tracking is implemented; Inter fonts are bundled locally. Runtime requests also load keyless map resources and remote Wikimedia/DVIDS photography listed in ASSET_LICENSES.md. These hosts receive normal network request information; do not describe the app as fully offline or as making map-only requests.
- ZIP lookup loads the bundled Census table and runs in the browser; no applicant form or backend is added by this task.
- Recovery tags preserve Git content, not external images, service uptime, host settings or browser policies. See docs/RECOVERY.md.

## Data sourcing guidelines

- Treat all unit data as public-source only. Never include non-public operational details, schedules, staffing, or personally identifiable information.
- Do not use official USCG emblems, seals, racing stripe or uniforms in a way that implies endorsement. Keep the disclaimer visible.
