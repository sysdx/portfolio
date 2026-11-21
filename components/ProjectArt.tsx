// Generative cover art for each project, drawn from what the project actually does.
// Deterministic (seeded), so server and browser render the same picture.
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const BG = (id: string, a = "#0d1520", b = "#000") => (
  <>
    <defs>
      <radialGradient id={`${id}-bg`} cx="30%" cy="20%" r="100%">
        <stop offset="0" stopColor={a} />
        <stop offset="1" stopColor={b} />
      </radialGradient>
      <linearGradient id={`${id}-g`} x1="0" x2="1">
        <stop offset="0" stopColor="#89aacc" />
        <stop offset="1" stopColor="#4e85bf" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill={`url(#${id}-bg)`} />
  </>
);

export function ProjectArt({ slug, label = true }: { slug: string; label?: boolean }) {
  const r = rng(slug);
  const id = `pa-${slug}`;
  let body: React.ReactNode = null;

  if (slug === "aimo-progress-prize-3") {
    const glyphs = ["∑", "∫", "π", "√", "∞", "≡", "∂", "φ", "Δ", "≤"];
    body = (
      <>
        {Array.from({ length: 34 }, (_, i) => (
          <text key={i} x={20 + r() * 360} y={30 + r() * 340} fontSize={12 + r() * 30} fill={`rgba(245,245,245,${0.08 + r() * 0.25})`} fontFamily="Georgia, serif" fontStyle="italic">{glyphs[i % glyphs.length]}</text>
        ))}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1="200" y1="200" x2={200 + Math.cos(a) * 120} y2={200 + Math.sin(a) * 120} stroke={`url(#${id}-g)`} strokeWidth="1.2" opacity=".7" />;
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={200 + Math.cos(a) * 120} cy={200 + Math.sin(a) * 120} r={i < 5 ? 7 : 4} fill={i < 5 ? "#89aacc" : "#3a4a5c"} />;
        })}
        <circle cx="200" cy="200" r="26" fill="#000" stroke="#89aacc" strokeWidth="1.5" />
        <text x="200" y="210" textAnchor="middle" fontSize="28" fill="#f5f5f5" fontFamily="Georgia, serif" fontStyle="italic">∑</text>
      </>
    );
  } else if (slug === "march-machine-learning-mania-2026") {
    const lines: React.ReactNode[] = [];
    const rounds = 5;
    for (let rd = 0; rd < rounds; rd++) {
      const n = 2 ** (rounds - rd);
      const gap = 360 / n;
      for (let k = 0; k < n; k += 2) {
        const y1 = 20 + gap * (k + 0.5), y2 = 20 + gap * (k + 1.5), x = 24 + rd * 34, xn = x + 34;
        const op = 0.25 + rd * 0.15;
        lines.push(<path key={`l${rd}-${k}`} d={`M${x} ${y1} H${xn} V${y2} H${x} M${xn} ${(y1 + y2) / 2} H${xn + 6}`} stroke={rd > 2 ? `url(#${id}-g)` : "rgba(245,245,245,.35)"} strokeWidth="1.1" fill="none" opacity={op} />);
        lines.push(<path key={`r${rd}-${k}`} d={`M${376 - rd * 34} ${y1} H${342 - rd * 34} V${y2} H${376 - rd * 34} M${342 - rd * 34} ${(y1 + y2) / 2} H${336 - rd * 34}`} stroke={rd > 2 ? `url(#${id}-g)` : "rgba(245,245,245,.35)"} strokeWidth="1.1" fill="none" opacity={op} />);
      }
    }
    body = (
      <>
        {lines}
        <circle cx="200" cy="200" r="30" fill="none" stroke="#89aacc" strokeWidth="1.5" />
        <text x="200" y="205" textAnchor="middle" fontSize="13" fill="#f5f5f5" fontFamily="monospace">P(win)</text>
      </>
    );
  } else if (slug === "rna-3d-folding") {
    const pts = Array.from({ length: 60 }, (_, i) => {
      const t = i / 59;
      return { x: 60 + t * 280, y: 200 + Math.sin(t * Math.PI * 4) * 70, y2: 200 - Math.sin(t * Math.PI * 4) * 70, z: Math.cos(t * Math.PI * 4) };
    });
    body = (
      <>
        {pts.map((p, i) => i % 3 === 0 && <line key={`b${i}`} x1={p.x} y1={p.y} x2={p.x} y2={p.y2} stroke="rgba(245,245,245,.18)" strokeWidth="1" />)}
        <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={`url(#${id}-g)`} strokeWidth="2.4" />
        <polyline points={pts.map((p) => `${p.x},${p.y2}`).join(" ")} fill="none" stroke="rgba(245,245,245,.6)" strokeWidth="1.6" />
        {pts.map((p, i) => i % 3 === 0 && <circle key={`n${i}`} cx={p.x} cy={p.y} r={2 + (p.z + 1) * 1.6} fill="#89aacc" opacity={0.5 + (p.z + 1) / 4} />)}
        {["A", "U", "G", "C", "G", "A", "U", "C"].map((c, i) => <text key={c + i} x={60 + i * 40} y="360" fontSize="13" fill="rgba(245,245,245,.35)" fontFamily="monospace">{c}</text>)}
      </>
    );
  } else if (slug === "heart-disease-ensemble") {
    const ecg = "M0 230 H90 L104 230 L112 200 L120 250 L134 120 L148 300 L158 230 H240 L254 230 L262 205 L270 248 L284 130 L298 290 L308 230 H400";
    body = (
      <>
        {Array.from({ length: 20 }, (_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="rgba(78,133,191,.08)" />)}
        {Array.from({ length: 20 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="rgba(78,133,191,.08)" />)}
        <path d={ecg} fill="none" stroke="#e06c75" strokeWidth="2.4" opacity=".9" />
        <path d={ecg} fill="none" stroke="#e06c75" strokeWidth="8" opacity=".15" />
        {[60, 160, 260, 340].map((x, i) => (
          <g key={x} transform={`translate(${x} 60)`} opacity=".55">
            <line x1="0" y1="0" x2={-14} y2="20" stroke="#89aacc" /><line x1="0" y1="0" x2={14} y2="20" stroke="#89aacc" />
            <circle r="3" fill="#89aacc" /><circle cx={-14} cy="20" r="2.4" fill="#f5f5f5" /><circle cx={14} cy="20" r="2.4" fill="#f5f5f5" />
            <text x="0" y="44" textAnchor="middle" fontSize="9" fill="#8a8a8a" fontFamily="monospace">{["XGB", "Cat", "LGBM", "NN"][i]}</text>
          </g>
        ))}
      </>
    );
  } else if (slug === "password-audit-tool") {
    const hex = "0123456789ABCDEF";
    body = (
      <>
        {Array.from({ length: 14 }, (_, row) => (
          <text key={row} x="24" y={40 + row * 25} fontSize="15" fontFamily="monospace" letterSpacing="2.4">
            {Array.from({ length: 22 }, (_, c) => {
              const ch = hex[Math.floor(r() * 16)];
              const hot = row === 6 && c < 5;
              return <tspan key={c} fill={hot ? "#89aacc" : `rgba(245,245,245,${0.08 + r() * 0.2})`} fontWeight={hot ? 700 : 400}>{ch}</tspan>;
            })}
          </text>
        ))}
        <rect x="18" y="172" width="96" height="26" rx="4" fill="none" stroke="#89aacc" strokeWidth="1.2" />
        <text x="130" y="190" fontSize="11" fill="#8a8a8a" fontFamily="monospace">only these 5 leave the machine</text>
      </>
    );
  } else {
    const bars = Array.from({ length: 22 }, (_, i) => {
      const x = (i - 10.5) / 4;
      return Math.exp(-x * x / 2) * 220 + r() * 30;
    });
    body = (
      <>
        {bars.map((hgt, i) => <rect key={i} x={30 + i * 16} y={330 - hgt} width="12" height={hgt} rx="2" fill={i % 5 === 0 ? `url(#${id}-g)` : "rgba(245,245,245,.18)"} />)}
        <path d={`M30 ${330 - bars[0]} ${bars.map((hgt, i) => `L${36 + i * 16} ${330 - hgt - 8}`).join(" ")}`} fill="none" stroke="#89aacc" strokeWidth="2" />
        <line x1="24" y1="330" x2="380" y2="330" stroke="rgba(245,245,245,.3)" />
      </>
    );
  }
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role={label ? "img" : undefined} aria-hidden={label ? undefined : true} aria-label={label ? `Illustration for ${slug.replace(/-/g, " ")}` : undefined}>
      {BG(id)}
      {body}
    </svg>
  );
}
