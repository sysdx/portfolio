"use client";
import { useEffect, useRef } from "react";

/** Writes the pointer position into --mx / --my (-1..1) on the parent element, for CSS parallax. */
export function PointerVars() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = host.getBoundingClientRect();
        host.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        host.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    return () => { host.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return <span ref={ref} hidden />;
}
