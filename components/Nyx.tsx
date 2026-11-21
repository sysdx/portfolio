"use client";
// Floating Nyx companion. Mood comes from the server (real records in the admin, a fixed
// greeting on the public site); this component only animates it. Animation never affects data.
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NyxArt, type NyxMood } from "./nyx/NyxArt";

type Corner = "br" | "bl" | "tr" | "tl";
const KEY = "nyx-corner";

export function Nyx({ mood, say, variant = "admin" }: { mood: NyxMood; say: string; variant?: "admin" | "site" }) {
  const [corner, setCorner] = useState<Corner>("br");
  const [hidden, setHidden] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [speak, setSpeak] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  // On the home page the big hero cat is Nyx; the companion only jumps in once you scroll past it.
  const [away, setAway] = useState(variant === "site" && path === "/");
  useEffect(() => {
    if (variant !== "site" || path !== "/") { setAway(false); return; }
    const on = () => setAway(window.scrollY < window.innerHeight * 0.7);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [variant, path]);

  useEffect(() => {
    try {
      const c = localStorage.getItem(KEY) as Corner | null;
      if (c && ["br", "bl", "tr", "tl"].includes(c)) setCorner(c);
      if (localStorage.getItem(`${KEY}-hidden`) === "1") setHidden(true);
    } catch {
      /* storage unavailable: defaults */
    }
  }, []);

  useEffect(() => {
    setSpeak(true);
    const t = setTimeout(() => setSpeak(false), 4500);
    return () => clearTimeout(t);
  }, [mood, say]);

  // Eyes follow the pointer.
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.4;
        setLook({ x: (e.clientX - cx) / (window.innerWidth / 2), y: (e.clientY - cy) / (window.innerHeight / 2) });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const save = (k: string, v: string) => {
    try { localStorage.setItem(k, v); } catch { /* ignore */ }
  };

  if (hidden) {
    return (
      <button className="nyx-show" onClick={() => { setHidden(false); save(`${KEY}-hidden`, "0"); }} aria-label="Show Nyx">
        <NyxArt mood="sleeping" uid="mini" />
      </button>
    );
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !ref.current) return;
    ref.current.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px) rotate(${(e.clientX - drag.x) / 30}deg)`;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag || !ref.current) return;
    ref.current.style.transform = "";
    const moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
    setDrag(null);
    if (moved < 6) { setSpeak((s) => !s); return; }
    const c: Corner = `${e.clientY > window.innerHeight / 2 ? "b" : "t"}${e.clientX > window.innerWidth / 2 ? "r" : "l"}` as Corner;
    setCorner(c);
    save(KEY, c);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const order: Corner[] = ["br", "bl", "tl", "tr"];
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const next = order[(order.indexOf(corner) + (e.key === "ArrowRight" ? 1 : 3)) % 4];
      setCorner(next);
      save(KEY, next);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSpeak((s) => !s);
    }
  };

  return (
    <div
      ref={ref}
      className={`nyx v-${variant} c-${corner}${drag ? " dragging" : ""}${away ? " away" : ""}`}
      aria-hidden={away || undefined}
      data-mood={mood}
      data-say={speak}
      role="group"
      tabIndex={0}
      aria-label={`Nyx the cat is ${mood}. ${say} Press Enter to show the message, arrow keys to move.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKey}
    >
      <span className="nyx-bubble" aria-hidden="true">{say}</span>
      <button className="nyx-hide" aria-label="Hide Nyx" onClick={() => { setHidden(true); save(`${KEY}-hidden`, "1"); }}>×</button>
      <NyxArt mood={mood} look={look} uid={`nyx-${variant}`} />
    </div>
  );
}
