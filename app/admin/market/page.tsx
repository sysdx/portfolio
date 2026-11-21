import Link from "next/link";
import { Candles } from "@/components/Candles";
import { PageHead, Panel, Pill, Stats } from "@/components/ui";
import { resetSimulation, simTrade, updateWatchlist } from "@/lib/actions-intel";
import { ago, compactUsd, fmtDateTime, pct, usd } from "@/lib/format";
import { getMarkets, getOhlc, getTopMarkets, replay, searchCoins, STALE_AFTER_MS, TIMEFRAMES, type Sourced } from "@/lib/market";
import { readStore } from "@/lib/store";

function Fresh({ r }: { r: Sourced<unknown> }) {
  const stale = Date.now() - Date.parse(r.fetchedAt) > STALE_AFTER_MS;
  return (
    <span className="meta">
      {r.source}, fetched {ago(r.fetchedAt)} {r.error ? <Pill tone="bad">error</Pill> : stale ? <Pill tone="warn">stale</Pill> : <Pill tone="ok">fresh</Pill>}
    </span>
  );
}

function heatColor(ch: number | null): string {
  if (ch == null) return "#142b4c";
  const a = Math.min(1, Math.abs(ch) / 8);
  return ch >= 0 ? `rgba(79,191,143,${0.18 + a * 0.6})` : `rgba(224,108,117,${0.18 + a * 0.6})`;
}

export default async function Market({ searchParams }: { searchParams: Promise<{ asset?: string; tf?: string; q?: string }> }) {
  const sp = await searchParams;
  const s = await readStore();
  const tz = s.settings.timezone;
  const watch = s.settings.watchlist;
  const asset = sp.asset && /^[a-z0-9-]+$/.test(sp.asset) ? sp.asset : watch[0] ?? "bitcoin";
  const tf = TIMEFRAMES.find((t) => t.key === sp.tf) ?? TIMEFRAMES[2];
  const sim = replay(s.simulation.startingCapitalUsd, s.simulation.trades);
  const held = sim.positions.map((p) => p.asset);
  const [markets, top, ohlc, search] = await Promise.all([
    getMarkets([...new Set([...watch, ...held, asset])]),
    getTopMarkets(40),
    getOhlc(asset, tf.days),
    sp.q ? searchCoins(sp.q) : Promise.resolve(null),
  ]);
  const price = (id: string) => markets.data?.find((m) => m.id === id)?.current_price ?? null;
  const posValue = sim.positions.reduce((n, p) => n + (price(p.asset) ?? 0) * p.qty, 0);
  const missingPrice = sim.positions.some((p) => price(p.asset) == null);
  const equity = sim.cash + posValue;
  const pnl = equity - s.simulation.startingCapitalUsd;
  const current = markets.data?.find((m) => m.id === asset);
  const href = (a: string, t = tf.key) => `/admin/market?asset=${a}&tf=${t}`;
  return (
    <>
      <PageHead title="Market intelligence" intro="Real market data from CoinGecko, with its source and age on every panel. Research and visualization only: no real accounts, no real trades." />

      <div className="grid side">
        <Panel
          title={current ? `${current.name} (${current.symbol.toUpperCase()})` : asset}
          sub={current ? <><strong style={{ color: "var(--text)", fontSize: "var(--t-md)" }}>{usd(current.current_price, current.current_price < 1 ? 4 : 2)}</strong> <span className={(current.price_change_percentage_24h ?? 0) >= 0 ? "up" : "down"}>{pct(current.price_change_percentage_24h)} 24h</span></> : undefined}
          action={<nav className="tabs" aria-label="Timeframe">{TIMEFRAMES.map((t) => <Link key={t.key} href={href(asset, t.key)} aria-current={t.key === tf.key ? "true" : undefined}>{t.label}</Link>)}</nav>}
        >
          {ohlc.error || !ohlc.data?.length ? (
            <p className="notice">{ohlc.error ?? "No price history returned for this asset."}</p>
          ) : (
            <Candles data={ohlc.data} />
          )}
          <Fresh r={ohlc} />
        </Panel>
        <Panel title="Watchlist" sub={<Fresh r={markets} />}>
          {markets.error && <p className="notice">{markets.error}</p>}
          <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {watch.map((id) => {
              const m = markets.data?.find((x) => x.id === id);
              return (
                <li key={id} className="inline" style={{ justifyContent: "space-between" }}>
                  <Link href={href(id)} aria-current={id === asset ? "true" : undefined} style={{ fontWeight: id === asset ? 600 : 400 }}>{m?.name ?? id}</Link>
                  <span className="inline">
                    <span className="mono" style={{ fontSize: "var(--t-sm)" }}>{m ? usd(m.current_price, m.current_price < 1 ? 4 : 2) : "—"}</span>
                    <span className={`mono ${(m?.price_change_percentage_24h ?? 0) >= 0 ? "up" : "down"}`} style={{ fontSize: "var(--t-xs)", width: 64, textAlign: "right" }}>{pct(m?.price_change_percentage_24h)}</span>
                    <form action={updateWatchlist}><input type="hidden" name="asset" value={id} /><input type="hidden" name="op" value="remove" /><button className="btn quiet small" type="submit" aria-label={`Remove ${id}`}>×</button></form>
                  </span>
                </li>
              );
            })}
          </ul>
          <form className="inline" style={{ marginTop: 14 }} action="/admin/market">
            <label className="sr-only" htmlFor="q">Search assets</label>
            <input id="q" type="search" name="q" placeholder="Search assets" defaultValue={sp.q} style={{ flex: 1 }} />
            <button className="btn quiet small" type="submit">Search</button>
          </form>
          {search && (
            <ul className="stack" style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
              {search.error && <li className="meta">{search.error}</li>}
              {search.data?.coins.slice(0, 6).map((c) => (
                <li key={c.id} className="inline" style={{ justifyContent: "space-between" }}>
                  <span>{c.name} <span className="meta">{c.symbol}{c.market_cap_rank ? `, rank ${c.market_cap_rank}` : ""}</span></span>
                  <form action={updateWatchlist}><input type="hidden" name="asset" value={c.id} /><input type="hidden" name="op" value="add" /><button className="btn small" type="submit" disabled={watch.includes(c.id)}>{watch.includes(c.id) ? "Added" : "Add"}</button></form>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div style={{ height: 16 }} />
      <Panel title="Simulated portfolio" sub="Virtual money only. Trades fill at the live CoinGecko price at the moment you place them.">
        <p className="notice sim">SIMULATION. These balances are not real money and are not your real holdings.</p>
        <Stats items={[
          { label: "Virtual starting capital", value: usd(s.simulation.startingCapitalUsd, 0) },
          { label: "Virtual equity now", value: missingPrice ? "price missing" : usd(equity) },
          { label: "Simulated return", value: missingPrice ? "—" : <span className={pnl >= 0 ? "up" : "down"}>{usd(pnl)} ({pct((pnl / s.simulation.startingCapitalUsd) * 100)})</span> },
          { label: "Virtual cash", value: usd(sim.cash) },
        ]} />
        <div className="grid side">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Position (simulated)</th><th className="num">Quantity</th><th className="num">Avg cost</th><th className="num">Value</th><th className="num">P&amp;L</th></tr></thead>
              <tbody>
                {sim.positions.length === 0 && <tr><td colSpan={5} className="muted">No simulated positions.</td></tr>}
                {sim.positions.map((p) => {
                  const pr = price(p.asset);
                  const val = pr != null ? pr * p.qty : null;
                  return (
                    <tr key={p.asset}>
                      <td><Link href={href(p.asset)}>{p.asset}</Link></td>
                      <td className="num mono">{p.qty.toPrecision(6)}</td>
                      <td className="num mono">{usd(p.costUsd / p.qty)}</td>
                      <td className="num mono">{val != null ? usd(val) : "—"}</td>
                      <td className={`num mono ${val != null && val - p.costUsd >= 0 ? "up" : "down"}`}>{val != null ? usd(val - p.costUsd) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {s.simulation.trades.length > 0 && (
              <details className="disclose" style={{ marginTop: 12 }}>
                <summary>Simulated trade history ({s.simulation.trades.length})</summary>
                <table><tbody>{[...s.simulation.trades].reverse().slice(0, 50).map((t) => (
                  <tr key={t.id}><td className="meta">{fmtDateTime(t.at, tz)}</td><td>{t.side}</td><td>{t.asset}</td><td className="num mono">{t.qty.toPrecision(6)}</td><td className="num mono">@ {usd(t.priceUsd)}</td></tr>
                ))}</tbody></table>
              </details>
            )}
          </div>
          <div className="stack" style={{ gap: 16 }}>
            <form action={simTrade} className="form">
              <div className="row">
                <label>Asset<select name="asset" defaultValue={asset}>{[...new Set([...watch, ...held])].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
                <label>Side<select name="side"><option value="buy">Buy</option><option value="sell">Sell</option></select></label>
              </div>
              <label>Amount (virtual USD)<input type="number" name="usd" min="1" step="any" required /></label>
              <div className="actions"><button className="btn" type="submit">Place simulated trade</button></div>
            </form>
            <form action={resetSimulation} className="form">
              <label>Reset with virtual capital<input type="number" name="capital" min={100} defaultValue={s.simulation.startingCapitalUsd} /></label>
              <div className="actions"><button className="btn danger" type="submit">Reset simulation</button></div>
            </form>
          </div>
        </div>
      </Panel>

      <div style={{ height: 16 }} />
      <Panel title="Market heatmap" sub={<>Top 40 by market cap, colored by 24h change. <Fresh r={top} /></>}>
        {top.error || !top.data ? <p className="notice">{top.error ?? "No data."}</p> : (
          <div className="heat">
            {top.data.map((m) => (
              <Link key={m.id} href={href(m.id)} style={{ background: heatColor(m.price_change_percentage_24h) }} title={`${m.name}: ${usd(m.current_price)}, market cap ${compactUsd(m.market_cap)}, volume ${compactUsd(m.total_volume)}`}>
                <b>{m.symbol.toUpperCase()}</b>
                <span>{pct(m.price_change_percentage_24h)}</span>
                <span style={{ opacity: 0.75 }}>{compactUsd(m.market_cap)}</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
      <p className="meta" style={{ marginTop: 12 }}>Market news needs a source you're licensed to use and isn't included yet. Data provided by CoinGecko.</p>
    </>
  );
}
