"use client";
import { useEffect, useRef } from "react";

/** A soft glow and a small dot that trail the pointer; the dot grows over links. Fine pointers only. */
export function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = -500, y = -500, gx = x, gy = y, raf = 0;
    const onMove = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      dot.current?.classList.toggle("big", !!(e.target as HTMLElement).closest("a,button"));
    };
    const loop = () => {
      gx += (x - gx) * 0.12; gy += (y - gy) * 0.12;
      if (glow.current) glow.current.style.transform = `translate(${gx}px, ${gy}px)`;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={glow} className="cursor-glow" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
