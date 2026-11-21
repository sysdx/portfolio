"use client";
// The big hero Nyx: watches your cursor, purrs (hops) when you hover, and naps if you leave it alone.
import { useEffect, useRef, useState } from "react";
import { NyxArt, type NyxMood } from "./NyxArt";

export function NyxHero() {
  const ref = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [mood, setMood] = useState<NyxMood>("idle");
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let raf = 0;
    const wake = () => {
      setMood((m) => (m === "sleeping" ? "curious" : m));
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(() => setMood("sleeping"), 12000);
    };
    const onMove = (e: PointerEvent) => {
      wake();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setLook({ x: (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), y: (e.clientY - (r.top + r.height * 0.35)) / (window.innerHeight / 2) });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    wake();
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); if (idle.current) clearTimeout(idle.current); };
  }, []);
  return (
    <div
      ref={ref}
      className="hero-cat"
      onPointerEnter={() => setMood("happy")}
      onPointerLeave={() => setMood("idle")}
      onClick={() => { setMood("celebrating"); setTimeout(() => setMood("idle"), 2200); }}
      aria-hidden="true"
    >
      <span className="hero-cat-note">{mood === "sleeping" ? "Nyx is napping" : "Nyx keeps the receipts"}</span>
      <NyxArt mood={mood} look={look} uid="hero" />
      <span className="hero-cat-perch" />
    </div>
  );
}
