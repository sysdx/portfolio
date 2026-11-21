# Plan

**Phase 1 (this build, no keys):** public portfolio, admin with all modules on a local store, organization registry, task workflow with quality gates, Codeforces contest import as the first verified source, calendar, campaigns, academy, bounty workspace, market dashboard with simulated portfolio, Nyx (2D).

**Phase 2 (Supabase):** apply `supabase/migrations/0001_init.sql`, replace `lib/store.ts` internals, Supabase Auth on `/admin` (then set `ADMIN_AUTH_READY=true`), scheduled imports via Vercel Cron, deploy to Vercel.

**Phase 3 (AI + integrations):** Claude-powered Chief of Staff planner, website assistant, MCP server wrapping `/api/tasks` for Claude Desktop, Kaggle API operations, GitHub token operations.

**Phase 4 (polish):** 3D Nyx with a licensed rigged model, Google Calendar sync, licensed market news, MotionSites-driven visual refinements.
