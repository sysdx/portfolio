"use client";
// Intro: 000 → 100 with rotating words, while Nyx walks the progress bar.
// Shown once per browser session; skipped entirely under reduced motion (CSS) and after the first visit.
import { useEffect, useState } from "react";
import { NyxWalker } from "../nyx/NyxArt";

const WORDS = ["Research", "Build", "Prove"];
const DURATION = 2400;

export function Loader() {
  const [count, setCount] = useState(0);
  const [word, setWord] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem("ros-intro"); } catch { /* ignore */ }
    if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches) { setDone(true); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => { setDone(true); try { sessionStorage.setItem("ros-intro", "1"); } catch { /* ignore */ } }, 350);
    };
    raf = requestAnimationFrame(tick);
    const wt = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 800);
    return () => { cancelAnimationFrame(raf); clearInterval(wt); };
  }, []);
  return (
    <div className={`loader${done ? " done" : ""}`} aria-hidden="true">
      <p className="loader-label">Portfolio</p>
      <div className="loader-word display"><span key={word}>{WORDS[word]}</span></div>
      <p className="loader-count">{String(count).padStart(3, "0")}</p>
      <div className="loader-bar">
        <i style={{ transform: `scaleX(${count / 100})` }} />
        <div className="loader-cat" style={{ left: `${count}%` }}><NyxWalker /></div>
      </div>
    </div>
  );
}
