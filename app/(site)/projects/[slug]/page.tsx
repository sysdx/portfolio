import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectArt } from "@/components/ProjectArt";
import { projects } from "@/content/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <div className="site-wrap">
      <header className="page-title" style={{ paddingTop: 120 }}>
        <p data-reveal style={{ marginTop: 0, marginBottom: 14, fontSize: "var(--t-sm)" }}><Link href="/projects">Work</Link></p>
        <h1 data-reveal className="display" style={{ fontSize: "clamp(2.8rem,7vw,5.6rem)", lineHeight: .95 }}>{p.title}</h1>
        <p data-reveal style={{ ["--d" as string]: "120ms" }}>{p.summary}</p>
      </header>
      <div className="card3" data-reveal style={{ aspectRatio: "21 / 8", marginBottom: 56 }}>
        <div className="art"><ProjectArt slug={p.slug} /></div>
      </div>
      <div className="detail">
        <div className="prose">
          <h2 style={{ marginTop: 0 }}>Approach</h2>
          <ul>
            {p.approach.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <h2>Result</h2>
          <p>{p.result ?? "No verified result is listed yet. The full pipeline is in the repository."}</p>
        </div>
        <aside>
          <dl style={{ margin: 0, display: "grid", gap: 18 }}>
            <div><dt>Context</dt><dd>{p.context}</dd></div>
            <div><dt>Year</dt><dd>{p.year}</dd></div>
            <div>
              <dt>Stack</dt>
              <dd><ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            </div>
            <div><dt>Code</dt><dd><a href={p.repo}>{p.repo.replace("https://github.com/", "")}</a></dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
