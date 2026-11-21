import type { Metadata } from "next";
import Link from "next/link";
import { publishedPosts } from "@/lib/public-data";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Writing", description: "Technical articles and write-ups." };
export const dynamic = "force-dynamic";

export default async function Writing() {
  const posts = await publishedPosts();
  return (
    <div className="site-wrap" style={{ paddingBottom: 96 }}>
      <header className="page-title">
        <h1>Writing</h1>
        <p>Write-ups on competitions, methods and what I learned.</p>
      </header>
      {posts.length === 0 ? (
        <div className="empty-public">
          <h2>No articles yet</h2>
          <p>The first write-ups are being drafted. The code they'll describe is already on <a href="/open-source">GitHub</a>.</p>
        </div>
      ) : (
        <ul className="work">
          {posts.map((p) => (
            <li key={p.id}>
              <Link className="row" href={`/writing/${p.id}`}>
                <h3>{p.title}</h3>
                <span className="ctx">{p.body.slice(0, 90)}…</span>
                <span className="yr">{fmtDate(p.publishedAt).replace(/, \d{4}$/, "")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
