"use client";
// Infinite 3D cover-flow drum. Covers sit on a horizontal cylinder (CSS 3D) and the angle
// follows a critically damped spring: wheel, drag (with flick), and arrow keys all glide,
// nothing snaps, and it loops forever in both directions.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectArt } from "./ProjectArt";

export type DrumItem = { slug: string; title: string; context: string; summary: string; year: string };

const FACES = 12;
const STEP = 30; // degrees between covers
const R = 698, SIZE = 282, PERSP = 1510, PX_PER_COVER = 329;
const OMEGA = 8.5;

export function Drum({ items }: { items: DrumItem[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const axisRef = useRef<HTMLDivElement>(null);
  const st = useRef({ angle: -60, target: 0, vel: 0, k: 1, dragging: false, lastY: 0, lastT: 0, moved: 0, reduced: false });
  const [front, setFront] = useState(0);
  const faces = Array.from({ length: FACES }, (_, i) => items[i % items.length]);

  const frontOf = (angle: number) => (((Math.round(angle / STEP) % FACES) + FACES) % FACES);

  const layout = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    const portrait = w < 820 && h > w;
    const k = portrait ? Math.min((h - 260) / 900, (0.64 * w) / SIZE) : Math.min(h / 900, (0.3 * w) / SIZE);
    st.current.k = Math.max(0.35, k);
    stage.style.setProperty("--k", String(st.current.k));
    stage.style.setProperty("--persp", `${PERSP * st.current.k}px`);
    stage.style.setProperty("--size", `${SIZE * st.current.k}px`);
    stage.style.setProperty("--cx", portrait ? "50%" : "70.76%");
    stage.style.setProperty("--cy", portrait ? "40%" : "50%");
    stage.querySelectorAll<HTMLElement>(".drum-face").forEach((f, i) => {
      f.style.transform = `rotateX(${-STEP * i}deg) translateZ(${R * st.current.k}px)`;
    });
  }, []);

  const paint = useCallback(() => {
    const s = st.current;
    if (axisRef.current) axisRef.current.style.transform = `translateZ(${-R * s.k}px) rotateX(${s.angle}deg)`;
    const f = frontOf(s.angle);
    setFront((p) => (p === f ? p : f));
  }, []);

  useEffect(() => {
    const s = st.current;
    s.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (s.reduced) s.angle = 0;
    layout();
    paint();
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      let dt = Math.min(0.064, (t - last) / 1000);
      last = t;
      if (!s.dragging && !s.reduced) {
        while (dt > 0) {
          const h = Math.min(0.004, dt);
          const acc = OMEGA * OMEGA * (s.target - s.angle) - 2 * OMEGA * s.vel;
          s.vel += acc * h;
          s.angle += s.vel * h;
          dt -= h;
        }
        if (Math.abs(s.target - s.angle) < 0.0005 && Math.abs(s.vel) < 0.01) { s.angle = s.target; s.vel = 0; }
      }
      paint();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const degPerPx = () => STEP / (PX_PER_COVER * s.k);
    const nudge = (deg: number) => {
      s.target += deg;
      if (s.reduced) s.angle = s.target;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const mult = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      nudge(e.deltaY * mult * degPerPx());
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest(".drum-info, .pill-nav, .nyx, button")) return;
      s.dragging = true; s.moved = 0; s.vel = 0; s.target = s.angle;
      s.lastY = e.clientY; s.lastT = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging) return;
      const now = performance.now();
      const dy = e.clientY - s.lastY;
      const d = -dy * degPerPx();
      s.angle += d; s.target = s.angle; s.moved += Math.abs(dy);
      const v = d / Math.max(0.001, (now - s.lastT) / 1000);
      s.vel = 0.7 * v + 0.3 * s.vel;
      s.lastY = e.clientY; s.lastT = now;
    };
    const onUp = () => {
      if (!s.dragging) return;
      s.dragging = false;
      if (performance.now() - s.lastT < 90 && !s.reduced) s.target = s.angle + (s.vel * 2) / OMEGA;
      else s.vel = 0;
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); nudge(STEP); }
      else if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); nudge(-STEP); }
    };
    const onClick = (e: MouseEvent) => {
      if (s.moved > 6) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", layout);
    stageRef.current?.addEventListener("click", onClick, true);
    const stage = stageRef.current;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", layout);
      stage?.removeEventListener("click", onClick, true);
    };
  }, [layout, paint]);

  const goTo = (i: number) => {
    const s = st.current;
    const cur = frontOf(s.target);
    let diff = (i - cur) % FACES;
    if (diff > FACES / 2) diff -= FACES;
    if (diff < -FACES / 2) diff += FACES;
    s.target = Math.round(s.target / STEP) * STEP + diff * STEP;
    if (s.reduced) s.angle = s.target;
  };

  const p = faces[front];
  const n = items.length;
  return (
    <div className="drum-page" ref={stageRef}>
      <div className="drum-stage">
        <div className="drum-axis" ref={axisRef}>
          {faces.map((f, i) => (
            <div className="drum-face" key={i}>
              <Link
                href={`/projects/${f.slug}`}
                tabIndex={i === front ? 0 : -1}
                aria-hidden={i === front ? undefined : true}
                onClick={(e) => { if (i !== front) { e.preventDefault(); goTo(i); } }}
                aria-label={`${f.title}: open project`}
              >
                <ProjectArt slug={f.slug} label={false} />
              </Link>
              <span className="cap">{f.context.replace(/ \(.*\)$/, "")}, {f.year}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="drum-info" aria-live="polite">
        <div key={p.slug} className="swap">
          <p className="count">{String((front % n) + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</p>
          <h1>{p.title}</h1>
          <p className="ctx">{p.context}</p>
          <p className="sum" style={{ marginTop: 12 }}>{p.summary}</p>
        </div>
        <div className="acts">
          <Link className="btn-ring solid" href={`/projects/${p.slug}`}>Open project</Link>
          <Link className="btn-ring outline" href="/projects?view=list">List view</Link>
        </div>
      </div>
      <div className="drum-progress" aria-hidden="true">
        {items.map((it, i) => <i key={it.slug} className={front % n === i ? "on" : ""} />)}
      </div>
      <p className="drum-hint">Scroll, drag or use the arrow keys</p>
    </div>
  );
}
