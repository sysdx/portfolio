import type { Candle } from "@/lib/market";

/** Server-rendered candlestick chart. Hover a candle for its values. */
export function Candles({ data, height = 300 }: { data: Candle[]; height?: number }) {
  const W = 900;
  const H = height;
  const pad = { l: 8, r: 70, t: 12, b: 26 };
  const lo = Math.min(...data.map((d) => d[3]));
  const hi = Math.max(...data.map((d) => d[2]));
  const span = hi - lo || 1;
  const y = (v: number) => pad.t + ((hi - v) / span) * (H - pad.t - pad.b);
  const step = (W - pad.l - pad.r) / data.length;
  const bw = Math.max(1, Math.min(12, step * 0.65));
  const ticks = Array.from({ length: 5 }, (_, i) => lo + (span * i) / 4);
  const fmt = (v: number) => (v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v >= 1 ? v.toFixed(2) : v.toPrecision(3));
  const first = data[0][0];
  const last = data[data.length - 1][0];
  const longRange = last - first > 3 * 86400000;
  const label = (t: number) => new Date(t).toLocaleString("en-US", longRange ? { month: "short", day: "numeric" } : { hour: "numeric", minute: "2-digit" });
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Candlestick chart, low ${fmt(lo)}, high ${fmt(hi)} US dollars`}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid-line" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
          <text className="axis" x={W - pad.r + 8} y={y(t) + 4}>{fmt(t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const [t, o, h, l, c] = d;
        const up = c >= o;
        const x = pad.l + i * step + step / 2;
        const color = up ? "#4fbf8f" : "#e06c75";
        return (
          <g key={t}>
            <title>{`${new Date(t).toLocaleString("en-US")}: open ${fmt(o)}, high ${fmt(h)}, low ${fmt(l)}, close ${fmt(c)}`}</title>
            <rect x={x - step / 2} y={pad.t} width={step} height={H - pad.t - pad.b} fill="transparent" />
            <line x1={x} x2={x} y1={y(h)} y2={y(l)} stroke={color} strokeWidth="1" />
            <rect x={x - bw / 2} y={y(Math.max(o, c))} width={bw} height={Math.max(1, Math.abs(y(o) - y(c)))} fill={color} rx="1" />
          </g>
        );
      })}
      {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
        <text key={i} className="axis" x={pad.l + i * step + step / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>{label(data[i][0])}</text>
      ))}
    </svg>
  );
}
