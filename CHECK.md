# Verification — 2026-11-21

## Passed
- **Workflow tests: 17/17** (`pnpm test`). They cover the full Codeforces slice (plan → run → review → verified events), idempotency, re-import without duplicates, date-change history, network failure (source marked unhealthy, Nyx concerned, retry succeeds), autonomy levels 0 and 1, role permissions, owner ≠ reviewer, claims audit, freshness check, concurrent writes, simulated portfolio math, and time-zone conversion across daylight saving.
- **Codeforces response format** checked against the live API on 2026-11-21. The test fixture is a trimmed copy of that response.
- **Type check**: `lib/` and `content/` pass `tsc --strict`. Pages were checked against loose stand-ins for React and Next types, because those packages couldn't be installed in the build sandbox.
- **Rendering**: all 34 pages rendered to HTML with no errors and were screenshotted at 1440 px and 390 px. No horizontal overflow and no console errors (`docs/screenshots/`).

## Motion pass (same day)
- Home and Work pages mounted live in Chromium: intro, particle field, reveals, role cycle, hero Nyx eye tracking, drum wheel input (3 notches moved exactly one cover) all ran with no page errors, at 1440 and 390 px, no horizontal overflow.
- With reduced motion on: no intro, no particles moving, content visible immediately.
- All 35 routes still render; 17/17 tests pass.

## Not verified yet — do these on your machine
1. `pnpm install && pnpm build`. The Next.js build itself hasn't been run, because the sandbox had no network for installing packages.
2. Live API calls from the app (GitHub, Codeforces, CoinGecko). The sandbox had no outbound network. The market page's offline error state was checked; its live state wasn't.
3. Lighthouse scores.
