import type { Metadata } from "next";
import { playbooks } from "@/content/projects";
import { publicResearch } from "@/lib/public-data";

export const metadata: Metadata = { title: "Research", description: "Quantitative research, experiments and technical reports." };
export const dynamic = "force-dynamic";

export default async function Research() {
  const items = await publicResearch();
  const tracks = playbooks.filter((p) => /quant|probab|mathem/i.test(p.title));
  return (
    <div className="site-wrap" style={{ paddingBottom: 96 }}>
      <header className="page-title">
        <h1>Research</h1>
        <p>Reproducible experiments and reports. Each one links to its code and data.</p>
      </header>
      {items.length > 0 && (
        <ul className="work" style={{ marginBottom: 56 }}>
          {items.map((r) => (
            <li key={r.id}>
              <a className="row" href={r.repoUrl}>
                <h3>{r.title}</h3>
                <span className="ctx">{r.kind}</span>
                <span className="yr">{r.status === "done" ? "Done" : "Ongoing"}</span>
                {r.summary && <p className="sum">{r.summary}</p>}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="section-head">
        <h2>Research tracks</h2>
        <p>{items.length === 0 ? "Published reports will be listed above. These are the repositories they come from." : "The repositories these reports come from."}</p>
      </div>
      <dl className="focus">
        {tracks.map((p) => (
          <div key={p.title}>
            <dt><a href={p.repo}>{p.title}</a></dt>
            <dd>{p.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
