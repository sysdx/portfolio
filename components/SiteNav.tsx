"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Work" },
  { href: "/achievements", label: "Achievements" },
  { href: "/research", label: "Research" },
  { href: "/writing", label: "Writing" },
  { href: "/open-source", label: "Open source" },
  { href: "/about", label: "About" },
];

export function SiteNav({ initials }: { initials: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 100);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <header className="pill-nav">
        <nav className={`pill-nav-inner${scrolled ? " scrolled" : ""}`} aria-label="Main">
          <Link href="/" className="pill-logo" aria-label="Home">{initials}</Link>
          <span className="pill-div d" aria-hidden="true" />
          {LINKS.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className="pl" aria-current={active(l.href) ? "page" : undefined}>{l.label}</Link>
          ))}
          <span className="pill-div d" aria-hidden="true" />
          <Link href="/contact" className="pill-hi"><span>Say hi <span aria-hidden="true">↗</span></span></Link>
          <button className="pill-menu btn quiet small" style={{ marginLeft: 4, borderRadius: 999 }} aria-expanded={open} aria-controls="pill-sheet" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Menu"}</button>
        </nav>
      </header>
      {open && (
        <nav id="pill-sheet" className="pill-sheet glass" aria-label="Main">
          {LINKS.map((l) => <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}>{l.label}</Link>)}
        </nav>
      )}
    </>
  );
}
