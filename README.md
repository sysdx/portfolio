# Reputation OS

Your public portfolio and your private command center in one Next.js app.

- **Public site** (`/`): Home, About, Projects, Achievements, Research, Writing, Open source, Contact. Built only from your real repositories; achievements appear only after they're verified and you approve them.
- **Admin** (`/admin`): command center, task ledger with quality gates, approval center, calendar, organization (13 departments, 72 roles), sources and opportunity radar, campaigns, decision memory, Kaggle lab, hackathons, CP academy, bug bounty workspace, research, GitHub, content studio, market intelligence with a simulated portfolio, achievement vault, messages, settings, security and audit. Nyx the cat lives here.

**Look and motion** (no animation libraries; plain CSS and small React components, all respecting reduced motion):
- Black theme with a cool `#89AACC → #4E85BF` accent, Instrument Serif italic for display, Inter for text, liquid-glass cards.
- One-time intro: 000 → 100 counter with rotating words while Nyx walks the loading bar.
- Hero: floating particle constellation that moves away from your cursor, drifting glass chips with parallax, a cycling role line, and the big Nyx, who watches your cursor, hops when you hover and naps if you leave her alone.
- Work (`/projects`): an infinite 3D drum of project covers driven by a critically damped spring. Scroll, drag-and-flick, or arrow keys; `?view=list` for the grid.
- Scroll reveals with blur-in, bento cards with halftone and glass hover labels, count-up stats from real numbers, a marquee footer, a cursor glow.
- Project covers are generated SVG art drawn from what each project does (no stock photos).

Everything runs **without any API keys**. Data lives in `data/store.json` on your machine until you connect Supabase.

## Run it

```bash
pnpm install        # or npm install
pnpm dev            # http://localhost:3000 and http://localhost:3000/admin
pnpm test           # 17 workflow tests
pnpm typecheck
```

The admin works only on your machine (`pnpm dev`). A production build returns 404 for `/admin` until sign-in is set up, so deploying early can't expose it.

## Try the end-to-end slice

1. Open `/admin` and type **Import upcoming contests** into the command box.
2. The AI Chief of Staff (rule-based for now) creates a task. The Source Acquisition Engineer calls the official Codeforces API; the Data Reliability Engineer reviews the evidence; policy and verification gates run.
3. The task page shows every gate, the evidence and the log. The contests appear on the **Calendar** as *verified* dates with their source and retrieval time. Run it again later: if Codeforces moves a contest, the old time is kept in the event's history and the change is logged.
4. Other commands that work today: *Sync my GitHub repos*, *Update my Codeforces rating* (add your handle in Settings), *Audit my public claims*, *Check data freshness*. Anything else becomes a manual task for the Program Manager.

The same thing works over HTTP for Claude Desktop or an assistant later:

```bash
curl -X POST localhost:3000/api/tasks -H 'Idempotency-Key: abc123' -H 'content-type: application/json' -d '{"command":"Import upcoming contests"}'
```

## Publishing an achievement

Vault → add it with an evidence link → **Verify** → **Request publish** → Approval center → **Approve**. It then appears on `/achievements`. Unverifying it takes it down.

## Where things are

| Path | What |
|---|---|
| `content/site.ts` | Your name, bio, links. **Edit this first.** |
| `content/projects.ts` | Projects, written from your public notebooks. No results claimed. |
| `lib/org.ts` | Departments, roles, permissions, autonomy levels. Roles marked `proposed` weren't named in your spec. |
| `lib/operations.ts` | The only things roles can actually do. Add new ones here. |
| `lib/workflow.ts` | Task creation, idempotency, quality gates, approvals. |
| `lib/store.ts` | Local JSON store; swapped for Supabase in phase 2. |
| `supabase/migrations/0001_init.sql` | Phase 2 schema with row level security, fact history and append-only lessons. |
| `tests/` | Workflow tests, run against a recorded real Codeforces response. |

## What needs keys (next phases)

| Phase | Needs | Unlocks |
|---|---|---|
| 2 | Supabase project | Saving on the live site, sign-in for `/admin`, durable job queue, scheduled imports |
| 3 | Anthropic API key | Natural-language Chief of Staff, website assistant, MCP server for Claude Desktop over `/api/tasks` |
| 3 | Kaggle token | Kaggle lab automation (competitions, kernels, scores) |
| 4 | — | 3D Nyx (React Three Fiber + a licensed rigged model), Google Calendar sync, market news from a licensed source |

Keys go in `.env.local` (see `.env.example`) or Vercel's environment settings, never in git.
