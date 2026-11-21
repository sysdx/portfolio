import Link from "next/link";
import { CountUp } from "@/components/motion/CountUp";
import { Loader } from "@/components/motion/Loader";
import { ParticleField } from "@/components/motion/ParticleField";
import { PointerVars } from "@/components/motion/PointerVars";
import { RoleCycle } from "@/components/motion/RoleCycle";
import { NyxHero } from "@/components/nyx/NyxHero";
import { ProjectArt } from "@/components/ProjectArt";
import { playbooks, projects } from "@/content/projects";
import { site } from "@/content/site";
import { fmtDate } from "@/lib/format";
import { publicAchievements, publicRepos } from "@/lib/public-data";

// Floating chips: real techniques from the projects, scattered with different depths and speeds.
const CHIPS = [
  { t: "Qwen3-32B", c: "llm", x: "8%", y: "22%", d: 18, dur: "7s" },
  { t: "Brier score", c: "metric", x: "78%", y: "18%", d: -14, dur: "8.5s" },
  { t: "k-mer index", c: "bio", x: "84%", y: "52%", d: 22, dur: "6.5s", sm: true },
  { t: "XGBoost + CatBoost", c: "ensemble", x: "6%", y: "64%", d: -20, dur: "9s", sm: true },
  { t: "Elo ratings", c: "feature", x: "16%", y: "84%", d: 12, dur: "7.5s", sm: true },
  { t: "k-anonymity", c: "security", x: "70%", y: "80%", d: -10, dur: "8s", sm: true },
];

export default async function Home() {
  const [{ repos, source }, achievements] = await Promise.all([publicRepos(), publicAchievements()]);
  const featured = [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)].slice(0, 4);
  const kaggle = projects.filter((p) => /kaggle/i.test(p.context)).length;
  return (
    <>
      <Loader />
      <section className="hero2" aria-labelledby="hero-title">
        <PointerVars />
        <ParticleField />
        <div className="hero2-orb" style={{ width: 560, height: 560, left: "-10%", top: "-20%", background: "rgba(78,133,191,.22)" }} aria-hidden="true" />
        <div className="hero2-orb" style={{ width: 420, height: 420, right: "-8%", bottom: "-10%", background: "rgba(137,170,204,.12)", animationDuration: "30s" }} aria-hidden="true" />
        {CHIPS.map((c) => (
          <div key={c.t} className={`chip glass${c.sm ? " hide-sm" : ""}`} style={{ left: c.x, top: c.y, ["--depth" as string]: c.d, ["--dur" as string]: c.dur }} aria-hidden="true">
            <span><code>{c.c}</code>{c.t}</span>
          </div>
        ))}
        <div className="hero2-content">
          <p className="eyebrow" data-reveal>Machine learning, mathematics, code</p>
          <h1 id="hero-title" data-reveal style={{ ["--d" as string]: "120ms" }}>{site.name}</h1>
          <p className="role" data-reveal style={{ ["--d" as string]: "240ms" }}>An ML <RoleCycle words={site.roles} /> with the work shown.</p>
          <p className="lede" data-reveal style={{ ["--d" as string]: "360ms" }}>{site.summary}</p>
          <div className="actions" data-reveal style={{ ["--d" as string]: "480ms" }}>
            <Link className="btn-ring solid" href="/projects">See the work</Link>
            <a className="btn-ring outline" href={site.links.github}>GitHub profile <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <NyxHero />
        <div className="scroll-hint" aria-hidden="true">Scroll<i /></div>
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <div className="site-wrap">
          <div className="sh" data-reveal>
            <div>
              <p className="eyebrow k">Selected work</p>
              <h2>Featured <em>projects</em></h2>
              <p>Competition pipelines and tools, from first notebook to final submission.</p>
            </div>
            <Link className="btn-ring outline" href="/projects">View all work <span aria-hidden="true">→</span></Link>
          </div>
          <div className="bento">
            {featured.map((p, i) => (
              <Link key={p.slug} href={`/projects/${p.slug}`} className="card3" data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
                <div className="art"><ProjectArt slug={p.slug} label={false} /></div>
                <div className="meta3"><div><h3>{p.title}</h3><small>{p.context}</small></div><small>{p.year}</small></div>
                <div className="veil"><span>View — <em>{p.title}</em></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <div className="site-wrap">
          <div className="sh" data-reveal>
            <div>
              <p className="eyebrow k">Focus</p>
              <h2>What I <em>work on</em></h2>
            </div>
          </div>
          <div className="gcards">
            {site.focus.map((f, i) => (
              <div key={f.area} className="glass gcard" data-reveal style={{ ["--d" as string]: `${i * 80}ms` }}>
                <span className="n">{["∑", "∫", "π", "σ", "λ"][i % 5]}</span>
                <div><h3>{f.area}</h3><p style={{ marginTop: 6 }}>{f.detail}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <div className="site-wrap">
          <div className="stats3" data-reveal>
            <div><CountUp to={repos.length} /><span>Public repositories</span></div>
            <div><CountUp to={kaggle} /><span>Kaggle competition pipelines</span></div>
            <div><CountUp to={playbooks.length} /><span>Study tracks and playbooks</span></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <div className="site-wrap grid side" style={{ alignItems: "start", gap: 48 }}>
          <div data-reveal>
            <p className="eyebrow k">Proof of work</p>
            <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)", fontWeight: 500, letterSpacing: "-.03em", marginTop: 16 }}>Shipped in <span className="shiny">public</span>, every week.</h2>
            <p className="muted" style={{ marginTop: 14, maxWidth: "46ch" }}>Straight from GitHub. Nothing here is written by hand.</p>
          </div>
          <div className="glass ledger-card" data-reveal style={{ padding: 24 }}>
            <p className="meta" style={{ marginBottom: 14 }}>{source === "GitHub API" ? "Live from GitHub" : `From the ${source.toLowerCase()}`}</p>
            <ol className="ledger" style={{ borderLeft: 0, paddingLeft: 0 }}>
              {repos.slice(0, 8).map((r, i) => (
                <li key={r.name} style={{ animationDelay: `${120 + i * 70}ms` }}>
                  <time dateTime={r.pushedAt}>{fmtDate(r.pushedAt).replace(/, \d{4}$/, "")}</time>
                  <a href={r.url}>{r.name}</a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {achievements.length > 0 && (
        <section className="section" style={{ borderBottom: 0 }}>
          <div className="site-wrap">
            <div className="sh" data-reveal><div><p className="eyebrow k">Results</p><h2>Verified <em>results</em></h2></div></div>
            <ul className="work">
              {achievements.slice(0, 4).map((a) => (
                <li key={a.id}><a className="row" href={a.evidenceUrl}><h3>{a.title}</h3><span className="ctx">{a.issuer}</span><span className="yr">{a.date.slice(0, 4)}</span></a></li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
