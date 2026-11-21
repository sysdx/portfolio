import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-wrap" style={{ padding: "120px 0" }}>
      <h1 style={{ fontSize: "var(--t-2xl)" }}>Page not found</h1>
      <p className="muted" style={{ marginTop: 12 }}>That address doesn't exist. <Link href="/">Go to the home page</Link>.</p>
    </main>
  );
}
