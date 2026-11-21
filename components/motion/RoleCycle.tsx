"use client";
import { useEffect, useState } from "react";

export function RoleCycle({ words, every = 2000 }: { words: string[]; every?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), every);
    return () => clearInterval(t);
  }, [words.length, every]);
  return <b key={i} aria-live="off">{words[i]}</b>;
}
