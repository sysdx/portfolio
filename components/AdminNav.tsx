"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavGroup = { title: string; items: Array<{ href: string; label: string; count?: number }> };

export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="adm-mobile-bar">
        <Link href="/admin" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 600 }}>Reputation OS</Link>
        <button className="btn quiet small" aria-expanded={open} aria-controls="adm-side" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Menu"}</button>
      </div>
      <aside id="adm-side" className="adm-side" data-open={open} onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>
        <Link href="/admin" className="adm-brand">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="#141416" /><path d="M7 20 L11 8 L14 14 L17 8 L21 20" stroke="#89aacc" strokeWidth="2" fill="none" strokeLinejoin="round" /></svg>
          <span><strong>Reputation OS</strong><small>Private command center</small></span>
        </Link>
        <nav aria-label="Admin">
          {groups.map((g) => (
            <div className="adm-group" key={g.title}>
              <h2>{g.title}</h2>
              {g.items.map((i) => {
                const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
                return (
                  <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}>
                    <span>{i.label}</span>
                    {!!i.count && <span className="count" aria-label={`${i.count} pending`}>{i.count}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="adm-group">
            <Link href="/">View public site</Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
