// Operations are the only things roles can actually *do*. Each one is authorized,
// internal and reversible (it only reads public data and writes caches/records),
// so it is safe to run at autonomy level 2. Anything external or irreversible
// must set `external: true`, which forces founder approval.
import type { CalendarEvent, RepoSnapshot, RiskLevel, Store } from "./types";

export interface OperationResult {
  evidence: { label: string; value: string }[];
  log: string[];
  apply: (s: Store) => void; // the state change, applied only if review passes
}

export interface Operation {
  id: string;
  title: string;
  description: string;
  ownerRoleId: string;
  reviewerRoleId: string;
  risk: RiskLevel;
  external: boolean;
  needs: string; // what it needs to run
  sourceId?: string; // source registry entry whose health this run reports
  completionCriteria: string;
  run: (s: Store) => Promise<OperationResult>;
  /** Automated tests on the result, run before independent review. */
  test: (r: OperationResult) => string | null; // null = pass, string = failure reason
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: "application/json", ...headers }, cache: "no-store" });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}

export async function fetchPublicRepos(user: string): Promise<RepoSnapshot[]> {
  const headers: Record<string, string> = {};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const data = (await getJson(
    `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&type=owner`,
    headers,
  )) as Array<Record<string, unknown>>;
  return data.map((r) => ({
    name: String(r.name),
    description: (r.description as string | null) ?? "",
    url: String(r.html_url),
    language: (r.language as string | null) ?? null,
    stars: Number(r.stargazers_count ?? 0),
    pushedAt: String(r.pushed_at),
    fork: Boolean(r.fork),
  }));
}

export const OPERATIONS: Operation[] = [
  {
    id: "github.sync",
    title: "Sync public GitHub repositories",
    description: "Reads your public repos from the GitHub API and refreshes the Open Source page.",
    ownerRoleId: "backend.integration",
    reviewerRoleId: "security.qa",
    risk: "low",
    external: false,
    sourceId: "src.github-api",
    needs: "A GitHub username in Settings. No key needed.",
    completionCriteria: "At least one repo fetched and cached with a timestamp.",
    async run(s) {
      const user = s.settings.githubUser.trim();
      if (!user) throw new Error("Add your GitHub username in Settings first.");
      const repos = await fetchPublicRepos(user);
      const fetchedAt = new Date().toISOString();
      return {
        evidence: [
          { label: "Source", value: `api.github.com/users/${user}/repos` },
          { label: "Repos fetched", value: String(repos.length) },
          { label: "Most recent push", value: repos[0] ? `${repos[0].name} (${repos[0].pushedAt.slice(0, 10)})` : "none" },
          { label: "Fetched at", value: fetchedAt },
        ],
        log: [`GET public repos for ${user}`, `Received ${repos.length} repos`],
        apply: (store) => {
          store.githubCache = { fetchedAt, repos };
        },
      };
    },
    test: (r) => (Number(r.evidence.find((e) => e.label === "Repos fetched")?.value ?? 0) > 0 ? null : "No repositories were returned."),
  },
  {
    id: "codeforces.sync",
    title: "Sync Codeforces rating",
    description: "Reads your rating and contest history from the public Codeforces API.",
    ownerRoleId: "cp.rating",
    reviewerRoleId: "security.qa",
    risk: "low",
    external: false,
    sourceId: "src.codeforces-api",
    needs: "A Codeforces handle in Settings. No key needed.",
    completionCriteria: "Handle resolved and rating snapshot stored.",
    async run(s) {
      const handle = s.settings.codeforcesHandle.trim();
      if (!handle) throw new Error("Add your Codeforces handle in Settings first.");
      const info = (await getJson(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`)) as {
        status: string;
        result?: Array<{ rating?: number; maxRating?: number; rank?: string }>;
        comment?: string;
      };
      if (info.status !== "OK" || !info.result?.[0]) throw new Error(info.comment ?? "Codeforces did not return this handle.");
      const hist = (await getJson(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`)) as {
        status: string;
        result?: unknown[];
      };
      const u = info.result[0];
      const contests = hist.result?.length ?? 0;
      const fetchedAt = new Date().toISOString();
      return {
        evidence: [
          { label: "Source", value: "codeforces.com/api/user.info + user.rating" },
          { label: "Handle", value: handle },
          { label: "Rating", value: u.rating != null ? String(u.rating) : "unrated" },
          { label: "Rated contests", value: String(contests) },
          { label: "Fetched at", value: fetchedAt },
        ],
        log: [`GET user.info for ${handle}`, `GET user.rating: ${contests} contests`],
        apply: (store) => {
          store.codeforcesCache = { fetchedAt, handle, rating: u.rating ?? null, maxRating: u.maxRating ?? null, rank: u.rank ?? null, contests };
        },
      };
    },
    test: (r) => (r.evidence.some((e) => e.label === "Handle") ? null : "No handle in the result."),
  },
  {
    id: "claims.audit",
    title: "Audit public claims",
    description: "Checks that everything shown publicly is verified and has evidence attached.",
    ownerRoleId: "brand.fact-checker",
    reviewerRoleId: "security.policy",
    risk: "low",
    external: false,
    needs: "Nothing.",
    completionCriteria: "Every public achievement and research item checked; problems listed.",
    async run(s) {
      const problems: string[] = [];
      for (const a of s.achievements.filter((x) => x.visibility === "public")) {
        if (!a.verified) problems.push(`Achievement "${a.title}" is public but not verified`);
        if (!/^https?:\/\//.test(a.evidenceUrl)) problems.push(`Achievement "${a.title}" has no evidence link`);
      }
      for (const r of s.research.filter((x) => x.visibility === "public")) {
        if (!/^https?:\/\//.test(r.repoUrl)) problems.push(`Research "${r.title}" is public without a source link`);
      }
      const checked = s.achievements.filter((x) => x.visibility === "public").length + s.research.filter((x) => x.visibility === "public").length;
      return {
        evidence: [
          { label: "Public items checked", value: String(checked) },
          { label: "Problems found", value: String(problems.length) },
          ...problems.map((p, i) => ({ label: `Problem ${i + 1}`, value: p })),
        ],
        log: [`Checked ${checked} public items`, problems.length ? `${problems.length} problems` : "No problems"],
        apply: () => {},
      };
    },
    test: (r) => (r.evidence.some((e) => e.label === "Public items checked") ? null : "Audit produced no count."),
  },
  {
    id: "codeforces.contests",
    title: "Import upcoming Codeforces contests",
    description: "Reads the official contest list and puts upcoming rated contests on the calendar as verified dates. Changed dates keep their history.",
    ownerRoleId: "intel.source-acquisition",
    reviewerRoleId: "intel.data-reliability",
    risk: "low",
    external: false,
    sourceId: "src.codeforces-api",
    needs: "Nothing. Public API.",
    completionCriteria: "Upcoming contests stored with source, retrieval time and verification; changes recorded in history.",
    async run() {
      const data = (await getJson("https://codeforces.com/api/contest.list?gym=false")) as {
        status: string;
        result?: Array<{ id: number; name: string; phase: string; durationSeconds: number; startTimeSeconds?: number }>;
        comment?: string;
      };
      if (data.status !== "OK" || !data.result) throw new Error(data.comment ?? "Codeforces contest.list failed.");
      const upcoming = data.result.filter((c) => c.phase === "BEFORE" && c.startTimeSeconds).slice(0, 40);
      const retrievedAt = new Date().toISOString();
      const sourceUrl = "https://codeforces.com/api/contest.list?gym=false";
      const incoming = upcoming.map((c) => ({
        externalId: `codeforces:${c.id}`,
        title: c.name,
        start: new Date(c.startTimeSeconds! * 1000).toISOString(),
        end: new Date((c.startTimeSeconds! + c.durationSeconds) * 1000).toISOString(),
        url: `https://codeforces.com/contests/${c.id}`,
      }));
      let created = 0;
      let changed = 0;
      const changes: string[] = [];
      return {
        evidence: [
          { label: "Source", value: sourceUrl },
          { label: "Retrieved at", value: retrievedAt },
          { label: "Upcoming contests in response", value: String(incoming.length) },
          { label: "Next contest", value: incoming.at(-1) ? `${incoming.at(-1)!.title} at ${incoming.at(-1)!.start}` : "none listed" },
        ],
        log: [`GET contest.list: ${data.result.length} contests, ${incoming.length} upcoming`],
        apply: (store) => {
          for (const c of incoming) {
            const existing = store.events.find((e) => e.externalId === c.externalId);
            if (!existing) {
              const ev: CalendarEvent = {
                id: `evt_${c.externalId.replace(":", "_")}`,
                externalId: c.externalId,
                title: c.title,
                kind: "contest",
                start: c.start,
                end: c.end,
                campaignId: "cmp.codeforces",
                opportunityId: null,
                recurrence: "none",
                notes: c.url,
                history: [],
                sourceId: "src.codeforces-api",
                sourceUrl,
                retrievedAt,
                verification: "verified",
              };
              store.events.push(ev);
              created++;
            } else {
              for (const field of ["title", "start", "end"] as const) {
                if (existing[field] !== c[field]) {
                  existing.history.push({ at: retrievedAt, field, from: String(existing[field]), to: String(c[field]), by: "intel.source-acquisition" });
                  changes.push(`${c.title}: ${field} changed`);
                  (existing as unknown as Record<string, string>)[field] = c[field];
                  changed++;
                }
              }
              existing.retrievedAt = retrievedAt;
              existing.verification = "verified";
            }
          }
          if (changes.length) {
            store.audit.unshift({ id: `aud_${Date.now().toString(36)}`, at: retrievedAt, action: "intel.change-detected", detail: changes.join("; ") });
          }
          store.audit.unshift({ id: `aud_${Date.now().toString(36)}i`, at: retrievedAt, action: "intel.imported", detail: `Codeforces: ${created} new, ${changed} field changes` });
        },
      };
    },
    test: (r) => {
      const n = Number(r.evidence.find((e) => e.label === "Upcoming contests in response")?.value ?? -1);
      return n >= 0 ? null : "Contest count missing from result.";
    },
  },
  {
    id: "intel.freshness",
    title: "Check data freshness",
    description: "Flags stale sources, unconfirmed dates, opportunities missing rules, and campaigns whose requirements were never checked.",
    ownerRoleId: "intel.data-reliability",
    reviewerRoleId: "security.qa",
    risk: "low",
    external: false,
    needs: "Nothing.",
    completionCriteria: "Every source, event, opportunity and campaign checked; problems listed.",
    async run(s) {
      const now = Date.now();
      const flags: string[] = [];
      for (const src of s.sources) {
        if (src.refresh === "manual") continue;
        const limit = src.refresh === "daily" ? 2 : 8;
        if (!src.lastCheckedAt || now - Date.parse(src.lastCheckedAt) > limit * 86400000) flags.push(`Source "${src.name}" not checked in ${limit} days`);
        if (src.health === "error") flags.push(`Source "${src.name}" last failed: ${src.lastError}`);
      }
      for (const e of s.events) {
        if (Date.parse(e.start) > now && e.verification !== "verified" && e.kind !== "training") flags.push(`Event "${e.title}" date is ${e.verification}`);
      }
      for (const o of s.opportunities.filter((x) => x.status !== "skipped")) {
        if (!o.eligibility) flags.push(`Opportunity "${o.name}" has no eligibility recorded`);
        if (!o.aiPolicy) flags.push(`Opportunity "${o.name}" has no AI-use policy recorded`);
      }
      for (const c of s.campaigns) {
        if (c.requirementsUrl && !c.requirementsCheckedAt) flags.push(`Campaign "${c.title}" requirements never checked against the official page`);
      }
      return {
        evidence: [
          { label: "Records checked", value: String(s.sources.length + s.events.length + s.opportunities.length + s.campaigns.length) },
          { label: "Flags", value: String(flags.length) },
          ...flags.slice(0, 30).map((f, i) => ({ label: `Flag ${i + 1}`, value: f })),
        ],
        log: [`${flags.length} flags`],
        apply: () => {},
      };
    },
    test: (r) => (r.evidence.some((e) => e.label === "Flags") ? null : "No flag count."),
  },
];

export function getOperation(id: string | null): Operation | undefined {
  return id ? OPERATIONS.find((o) => o.id === id) : undefined;
}
