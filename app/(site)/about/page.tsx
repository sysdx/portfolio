import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "About", description: site.about[0] };

export default function About() {
  return (
    <div className="site-wrap">
      <header className="page-title">
        <h1>About</h1>
        <p>{site.role}.</p>
      </header>
      <div className="prose" style={{ paddingBottom: 96 }}>
        {site.about.map((p) => (
          <p key={p.slice(0, 20)}>{p}</p>
        ))}
        <h2>Areas</h2>
        <ul>
          {site.focus.map((f) => (
            <li key={f.area}>
              <strong>{f.area}.</strong> {f.detail}.
            </li>
          ))}
        </ul>
        <h2>Elsewhere</h2>
        <ul>
          <li><a href={site.links.github}>GitHub</a></li>
          {site.links.kaggle && <li><a href={site.links.kaggle}>Kaggle</a></li>}
          {site.links.linkedin && <li><a href={site.links.linkedin}>LinkedIn</a></li>}
        </ul>
      </div>
    </div>
  );
}
