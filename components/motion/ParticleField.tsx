"use client";
// Floating particle field: slow upward drift, faint links between neighbours, and a soft
// push away from the cursor. Pauses when off-screen or in a background tab. Static under reduced motion.
import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; tw: number };

export function ParticleField({ density = 0.00011 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0, h = 0, raf = 0, visible = true, last = performance.now();
    let pts: P[] = [];
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(260, Math.round(w * h * density));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 6, vy: -4 - Math.random() * 10,
        r: Math.random() < 0.08 ? 1.6 + Math.random() * 1.4 : 0.4 + Math.random() * 1.1,
        a: 0.25 + Math.random() * 0.6, tw: Math.random() * Math.PI * 2,
      }));
      draw(0);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const link = 110;
      for (const p of pts) {
        if (dt) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) { const f = (1 - Math.sqrt(d2) / 140) * 90; const d = Math.sqrt(d2) || 1; p.x += (dx / d) * f * dt; p.y += (dy / d) * f * dt; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.tw += dt * 1.6;
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        }
      }
      ctx.lineWidth = 0.6;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < link * link) {
            ctx.strokeStyle = `rgba(137,170,204,${(1 - Math.sqrt(d2) / link) * 0.12})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        const alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
        ctx.fillStyle = p.r > 1.5 ? `rgba(170,200,235,${alpha})` : `rgba(245,245,245,${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        if (p.r > 1.5) { ctx.fillStyle = `rgba(137,170,204,${alpha * 0.15})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill(); }
      }
    };

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (visible && !document.hidden) draw(dt);
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(canvas);
    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(loop);
    }
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); };
  }, [density]);
  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
