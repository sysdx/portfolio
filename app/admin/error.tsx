"use client";
import Link from "next/link";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel" style={{ maxWidth: 640 }}>
      <h2>That action didn't go through</h2>
      <p className="muted" style={{ marginTop: 8 }}>{error.message || "Something went wrong while saving."}</p>
      <div className="inline" style={{ marginTop: 16 }}>
        <button className="btn" onClick={reset}>Try again</button>
        <Link className="btn quiet" href="/admin">Back to command center</Link>
      </div>
    </div>
  );
}
