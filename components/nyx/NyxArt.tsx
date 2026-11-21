// Nyx, drawn once and shared: the admin companion, the public companion and the hero cat.
// Pure SVG: no images, no 3D runtime. `look` moves the pupils (-1..1 on each axis).
export type NyxMood = "sleeping" | "idle" | "curious" | "happy" | "concerned" | "celebrating";

export function NyxArt({ mood = "idle", look = { x: 0, y: 0 }, uid = "n" }: { mood?: NyxMood; look?: { x: number; y: number }; uid?: string }) {
  const closed = mood === "sleeping";
  const px = Math.max(-1, Math.min(1, look.x)) * 3.2;
  const py = Math.max(-1, Math.min(1, look.y)) * 2.4;
  const pupilW = mood === "curious" ? 4.6 : mood === "concerned" ? 2 : 2.8;
  const g = (s: string) => `${uid}-${s}`;
  return (
    <svg viewBox="0 0 160 170" aria-hidden="true" className="nyx-art" data-mood={mood}>
      <defs>
        <radialGradient id={g("fur")} cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#2a2a31" />
          <stop offset=".45" stopColor="#111114" />
          <stop offset="1" stopColor="#050506" />
        </radialGradient>
        <radialGradient id={g("eye")} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset=".6" stopColor="#f2a93b" />
          <stop offset="1" stopColor="#b8691a" />
        </radialGradient>
        <filter id={g("glow")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id={g("collar")} x1="0" x2="1">
          <stop offset="0" stopColor="#89aacc" />
          <stop offset="1" stopColor="#4e85bf" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="162" rx="46" ry="6" fill="rgba(137,170,204,.10)" />
      <g className="nyx-body">
        <path className="nyx-tail" d="M112 140 C150 138 156 98 134 84 C128 80 122 84 126 90 C140 104 132 128 108 128 Z" fill={`url(#${g("fur")})`} />
        <path d="M44 160 C36 124 46 96 80 92 C114 96 124 124 116 160 Z" fill={`url(#${g("fur")})`} />
        <ellipse cx="62" cy="158" rx="12" ry="6" fill="#0b0b0d" />
        <ellipse cx="98" cy="158" rx="12" ry="6" fill="#0b0b0d" />
        <path d="M54 104 Q80 118 106 104" stroke={`url(#${g("collar")})`} strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="80" cy="114" r="4.2" fill="#89aacc" filter={`url(#${g("glow")})`} />
        <g className="nyx-head">
          <path className="nyx-ear-l" d="M42 50 L46 14 L70 38 Z" fill={`url(#${g("fur")})`} />
          <path className="nyx-ear-r" d="M118 50 L114 14 L90 38 Z" fill={`url(#${g("fur")})`} />
          <path d="M48 42 L50 24 L63 37 Z" fill="#3a2a3a" opacity=".8" />
          <path d="M112 42 L110 24 L97 37 Z" fill="#3a2a3a" opacity=".8" />
          <ellipse cx="80" cy="62" rx="40" ry="35" fill={`url(#${g("fur")})`} />
          {closed ? (
            <g stroke="#f2a93b" strokeWidth="2.6" fill="none" strokeLinecap="round">
              <path d="M56 64 q8 6 16 0" />
              <path d="M88 64 q8 6 16 0" />
            </g>
          ) : (
            <g>
              <ellipse cx="64" cy="61" rx="9.5" ry={mood === "concerned" ? 6.5 : 9.5} fill={`url(#${g("eye")})`} filter={`url(#${g("glow")})`} />
              <ellipse cx="96" cy="61" rx="9.5" ry={mood === "concerned" ? 6.5 : 9.5} fill={`url(#${g("eye")})`} filter={`url(#${g("glow")})`} />
              <ellipse className="nyx-pupil" cx={64 + px} cy={61 + py} rx={pupilW} ry={mood === "concerned" ? 5 : 7.6} fill="#050505" />
              <ellipse className="nyx-pupil" cx={96 + px} cy={61 + py} rx={pupilW} ry={mood === "concerned" ? 5 : 7.6} fill="#050505" />
              <circle cx={61 + px * 0.4} cy={57 + py * 0.4} r="2.2" fill="#fff" opacity=".9" />
              <circle cx={93 + px * 0.4} cy={57 + py * 0.4} r="2.2" fill="#fff" opacity=".9" />
              <g className="nyx-lids">
                <rect x="53" y="50" width="22" height="22" fill="#121215" />
                <rect x="85" y="50" width="22" height="22" fill="#121215" />
              </g>
            </g>
          )}
          {mood === "concerned" && (
            <g stroke="#3d3d48" strokeWidth="2.2" strokeLinecap="round">
              <path d="M54 48 l14 3" />
              <path d="M106 48 l-14 3" />
            </g>
          )}
          <path d="M76 74 h8 l-4 4 z" fill="#5a4152" />
          <path d={mood === "happy" || mood === "celebrating" ? "M72 80 q8 7 16 0" : mood === "concerned" ? "M73 83 q7 -4 14 0" : "M74 80 q3 3 6 0 q3 3 6 0"} stroke="#5a4152" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <g stroke="rgba(200,210,230,.35)" strokeWidth="1" strokeLinecap="round" className="nyx-whiskers">
            <path d="M50 74 h-20" /><path d="M50 79 l-19 5" /><path d="M110 74 h20" /><path d="M110 79 l19 5" />
          </g>
        </g>
      </g>
      {mood === "sleeping" && (
        <g fill="#89aacc" fontFamily="sans-serif" className="nyx-zzz"><text x="122" y="30" fontSize="16">z</text><text x="134" y="16" fontSize="11">z</text></g>
      )}
      {mood === "celebrating" && (
        <g fill="#89aacc" className="nyx-sparks">
          <circle cx="22" cy="40" r="3.5" /><circle cx="140" cy="30" r="3" /><circle cx="148" cy="70" r="2.4" /><circle cx="14" cy="88" r="2.2" />
        </g>
      )}
      {mood === "concerned" && <text x="132" y="34" fill="#e5b454" fontSize="22" fontWeight="700" fontFamily="sans-serif">!</text>}
    </svg>
  );
}

/** Side-on walking silhouette, used on the loading bar. */
export function NyxWalker() {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" className="nyx-walker">
      <path className="w-tail" d="M50 16 C60 14 62 4 56 2" stroke="#e9e9ec" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="20" rx="17" ry="8" fill="#e9e9ec" />
      <circle cx="15" cy="15" r="7.5" fill="#e9e9ec" />
      <path d="M10 10 L11 2 L16 8 Z M17 9 L20 2 L22 10 Z" fill="#e9e9ec" />
      <circle cx="12.5" cy="14.5" r="1.4" fill="#f2a93b" />
      <g stroke="#e9e9ec" strokeWidth="3" strokeLinecap="round">
        <path className="w-leg a" d="M22 25 L20 36" /><path className="w-leg b" d="M27 25 L29 36" />
        <path className="w-leg b" d="M42 25 L40 36" /><path className="w-leg a" d="M47 25 L49 36" />
      </g>
    </svg>
  );
}
