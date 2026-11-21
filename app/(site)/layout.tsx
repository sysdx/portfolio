import Link from "next/link";
import { CursorGlow } from "@/components/motion/CursorGlow";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { Nyx } from "@/components/Nyx";
import { SiteNav } from "@/components/SiteNav";
import { site } from "@/content/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    sameAs: Object.values(site.links).filter((v) => v.startsWith("http")),
    knowsAbout: site.focus.map((f) => f.area),
  };
  const initials = site.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const words = ["Models", "Math", "Code", "Proof"];
  return (
    <div className="site">
      <a href="#main" className="skip">Skip to content</a>
      <SiteNav initials={initials} />
      <main id="main" className="site-main">{children}</main>
      <footer className="foot2">
        <div className="marquee" aria-hidden="true">
          <div>{[...words, ...words, ...words, ...words].map((w, i) => <span key={i}>{w} •</span>)}</div>
        </div>
        <div className="site-wrap">
          <div className="foot2-cta" data-reveal>
            <h2>Have a problem worth <em>modeling?</em></h2>
            <Link className="btn-ring solid" href="/contact">Get in touch <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="foot2-bar">
            <nav aria-label="Elsewhere">
              <a href={site.links.github}>GitHub</a>
              {site.links.kaggle && <a href={site.links.kaggle}>Kaggle</a>}
              {site.links.linkedin && <a href={site.links.linkedin}>LinkedIn</a>}
            </nav>
            {site.availability && <span className="pulse-dot">{site.availability}</span>}
            <span>Every result here links to its evidence.</span>
          </div>
        </div>
      </footer>
      <RevealObserver />
      <CursorGlow />
      <Nyx mood="idle" say="Hi, I'm Nyx. Drag me anywhere, or hide me." variant="site" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
