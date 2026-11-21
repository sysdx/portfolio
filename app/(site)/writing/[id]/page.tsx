import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedPosts } from "@/lib/public-data";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (await publishedPosts()).find((p) => p.id === id);
  if (!post) notFound();
  return (
    <div className="site-wrap" style={{ paddingBottom: 96 }}>
      <header className="page-title">
        <p style={{ marginTop: 0, marginBottom: 14, fontSize: "var(--t-sm)" }}><Link href="/writing">Writing</Link></p>
        <h1>{post.title}</h1>
        <p>{fmtDate(post.publishedAt)}</p>
      </header>
      <article className="prose">
        {post.body.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </article>
    </div>
  );
}
