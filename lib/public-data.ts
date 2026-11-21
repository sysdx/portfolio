// What the public site is allowed to see: only verified, approved records.
import { fallbackRepos } from "@/content/projects";
import { site } from "@/content/site";
import { readStore } from "./store";

export async function publicAchievements() {
  const s = await readStore();
  return s.achievements.filter((a) => a.verified && a.visibility === "public").sort((a, b) => b.date.localeCompare(a.date));
}

export async function publicResearch() {
  const s = await readStore();
  return s.research.filter((r) => r.visibility === "public");
}

export async function publishedPosts() {
  const s = await readStore();
  return s.content.filter((c) => c.channel === "blog" && c.status === "published").sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export interface PublicRepo {
  name: string;
  description: string;
  url: string;
  language: string | null;
  pushedAt: string;
}

/** Live from GitHub (cached an hour), else the last sync, else the built-in list. */
export async function publicRepos(): Promise<{ repos: PublicRepo[]; source: string; asOf: string | null }> {
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/users/${site.handle}/repos?per_page=100&sort=pushed&type=owner`, { headers, next: { revalidate: 3600 } });
    if (res.ok) {
      const data = (await res.json()) as Array<Record<string, unknown>>;
      const repos = data
        .filter((r) => !r.fork && !r.private)
        .map((r) => ({ name: String(r.name), description: (r.description as string) ?? "", url: String(r.html_url), language: (r.language as string) ?? null, pushedAt: String(r.pushed_at) }));
      return { repos, source: "GitHub API", asOf: new Date().toISOString() };
    }
  } catch {
    /* fall through */
  }
  const s = await readStore();
  if (s.githubCache?.repos.length) {
    return { repos: s.githubCache.repos.filter((r) => !r.fork), source: "Last sync", asOf: s.githubCache.fetchedAt };
  }
  return {
    repos: fallbackRepos.map((r) => ({ ...r, url: `https://github.com/${site.handle}/${r.name}`, language: null })),
    source: "Saved list",
    asOf: null,
  };
}
