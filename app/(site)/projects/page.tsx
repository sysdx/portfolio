import type { Metadata } from "next";
import Link from "next/link";
import { Drum } from "@/components/Drum";
import { ProjectArt } from "@/components/ProjectArt";
import { playbooks, projects } from "@/content/projects";

export const metadata: Metadata = { title: "Work", description: "Competition pipelines, research tools and playbooks." };

export default async function Projects({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  if (view !== "list") {
    return (
      <>
        <Drum items={projects.map(({ slug, title, context, summary, year }) => ({ slug, title, context, summary, year }))} />
        <nav className="sr-only" aria-label="All projects">
          <ul>{projects.map((p) => <li key={p.slug}><Link href={`/projects/${p.slug}`}>{p.title}</Link></li>)}</ul>
        </nav>
      </>
    );
  }
  return (
    <div className="site-wrap" style={{ paddingTop: 120 }}>
      <div className="sh" data-reveal>
        <div>
          <p className="eyebrow k">Work</p>
          <h2>All <em>projects</em></h2>
          <p>Pipelines and tools from my public repositories. Results are listed only when I can link to proof.</p>
        </div>
        <Link className="btn-ring outline" href="/projects">3D view</Link>
      </div>
      <div className="bento">
        {projects.map((p, i) => (
          <Link key={p.slug} href={`/projects/${p.slug}`} className="card3" data-reveal style={{ ["--d" as string]: `${(i % 4) * 90}ms` }}>
            <div className="art"><ProjectArt slug={p.slug} label={false} /></div>
            <div className="meta3"><div><h3>{p.title}</h3><small>{p.context}</small></div><small>{p.year}</small></div>
            <div className="veil"><span>View — <em>{p.title}</em></span></div>
          </Link>
        ))}
      </div>
      <section className="section" style={{ borderBottom: 0 }}>
        <div className="sh" data-reveal><div><p className="eyebrow k">Foundations</p><h2>Playbooks and <em>study tracks</em></h2></div></div>
        <div className="gcards">
          {playbooks.map((p, i) => (
            <a key={p.title} href={p.repo} className="glass gcard" data-reveal style={{ ["--d" as string]: `${i * 70}ms`, color: "var(--text)", textDecoration: "none" }}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <div><h3>{p.title}</h3><p style={{ marginTop: 6 }}>{p.detail}</p></div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
