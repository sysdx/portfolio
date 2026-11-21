import type { Metadata } from "next";
import { publicAchievements } from "@/lib/public-data";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Achievements", description: "Verified results, each linked to its evidence." };
export const dynamic = "force-dynamic";

export default async function Achievements() {
  const items = await publicAchievements();
  return (
    <div className="site-wrap" style={{ paddingBottom: 96 }}>
      <header className="page-title">
        <h1>Achievements</h1>
        <p>Every entry here has been checked against its evidence before publishing.</p>
      </header>
      {items.length === 0 ? (
        <div className="empty-public">
          <h2>Nothing listed yet</h2>
          <p>Results appear here once they're verified with a link to proof. In the meantime, the <a href="/projects">projects</a> show the work itself.</p>
        </div>
      ) : (
        <ul className="work">
          {items.map((a) => (
            <li key={a.id}>
              <a className="row" href={a.evidenceUrl}>
                <h3>{a.title}</h3>
                <span className="ctx">{a.issuer}</span>
                <span className="yr">{fmtDate(a.date).replace(/^\w+ \d+, /, "")}</span>
                {a.notes && <p className="sum">{a.notes}</p>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
