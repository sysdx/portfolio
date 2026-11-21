import type { Metadata } from "next";
import { site } from "@/content/site";
import { publicRepos } from "@/lib/public-data";
import { fmtDate, fmtDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Open source", description: "Public repositories on GitHub." };
export const revalidate = 3600;

export default async function OpenSource() {
  const { repos, source, asOf } = await publicRepos();
  return (
    <div className="site-wrap" style={{ paddingBottom: 96 }}>
      <header className="page-title">
        <h1>Open source</h1>
        <p>Public repositories on <a href={site.links.github}>GitHub</a>, most recently pushed first.</p>
      </header>
      <ul className="repo-grid">
        {repos.map((r) => (
          <li key={r.name}>
            <a href={r.url}>{r.name}</a>
            {r.description && <p>{r.description}</p>}
            <small>{[r.language, `pushed ${fmtDate(r.pushedAt)}`].filter(Boolean).join(", ")}</small>
          </li>
        ))}
      </ul>
      <p className="data-note">Source: {source}{asOf ? `, as of ${fmtDateTime(asOf)}` : ""}.</p>
    </div>
  );
}
