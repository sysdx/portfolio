// CoinGecko market data. Works without a key at low rate limits; set
// COINGECKO_DEMO_API_KEY for the free Demo plan. Every result carries its
// source and fetch time so the UI can show freshness.
import type { SimTrade } from "./types";

const BASE = "https://api.coingecko.com/api/v3";
export const MARKET_SOURCE = "CoinGecko API";
export const STALE_AFTER_MS = 5 * 60 * 1000;

export interface Sourced<T> {
  data: T | null;
  fetchedAt: string;
  source: string;
  error: string | null;
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  last_updated: string;
}

async function cg<T>(path: string, revalidate = 60): Promise<Sourced<T>> {
  const fetchedAt = new Date().toISOString();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.COINGECKO_DEMO_API_KEY) headers["x-cg-demo-api-key"] = process.env.COINGECKO_DEMO_API_KEY;
  try {
    const res = await fetch(`${BASE}${path}`, { headers, next: { revalidate } });
    if (res.status === 429) return { data: null, fetchedAt, source: MARKET_SOURCE, error: "CoinGecko rate limit reached. Try again in a minute, or add a free Demo key." };
    if (!res.ok) return { data: null, fetchedAt, source: MARKET_SOURCE, error: `CoinGecko answered ${res.status}.` };
    return { data: (await res.json()) as T, fetchedAt, source: MARKET_SOURCE, error: null };
  } catch (e) {
    return { data: null, fetchedAt, source: MARKET_SOURCE, error: `Couldn't reach CoinGecko: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export function getMarkets(ids: string[]) {
  if (!ids.length) return Promise.resolve<Sourced<CoinMarket[]>>({ data: [], fetchedAt: new Date().toISOString(), source: MARKET_SOURCE, error: null });
  return cg<CoinMarket[]>(`/coins/markets?vs_currency=usd&ids=${ids.map(encodeURIComponent).join(",")}&price_change_percentage=24h,7d`);
}

export function getTopMarkets(n = 40) {
  return cg<CoinMarket[]>(`/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${n}&page=1&price_change_percentage=24h,7d`, 120);
}

/** [timestamp, open, high, low, close] */
export type Candle = [number, number, number, number, number];

export function getOhlc(id: string, days: number) {
  return cg<Candle[]>(`/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=${days}`, days <= 1 ? 60 : 600);
}

export function searchCoins(q: string) {
  return cg<{ coins: Array<{ id: string; name: string; symbol: string; market_cap_rank: number | null }> }>(`/search?query=${encodeURIComponent(q)}`, 3600);
}

export async function getLivePrice(id: string): Promise<{ price: number; fetchedAt: string } | null> {
  const r = await cg<Record<string, { usd: number }>>(`/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`, 0);
  const price = r.data?.[id]?.usd;
  return typeof price === "number" ? { price, fetchedAt: r.fetchedAt } : null;
}

export const TIMEFRAMES = [
  { key: "1d", days: 1, label: "24h" },
  { key: "7d", days: 7, label: "7 days" },
  { key: "30d", days: 30, label: "30 days" },
  { key: "90d", days: 90, label: "90 days" },
  { key: "1y", days: 365, label: "1 year" },
] as const;

export interface Position {
  asset: string;
  qty: number;
  costUsd: number;
}

/** Replays virtual trades into cash and positions. */
export function replay(startingCapitalUsd: number, trades: SimTrade[]): { cash: number; positions: Position[] } {
  let cash = startingCapitalUsd;
  const pos = new Map<string, Position>();
  for (const t of [...trades].sort((a, b) => a.at.localeCompare(b.at))) {
    const p = pos.get(t.asset) ?? { asset: t.asset, qty: 0, costUsd: 0 };
    if (t.side === "buy") {
      cash -= t.qty * t.priceUsd;
      p.costUsd += t.qty * t.priceUsd;
      p.qty += t.qty;
    } else {
      const avg = p.qty > 0 ? p.costUsd / p.qty : 0;
      cash += t.qty * t.priceUsd;
      p.costUsd -= avg * t.qty;
      p.qty -= t.qty;
    }
    pos.set(t.asset, p);
  }
  return { cash, positions: [...pos.values()].filter((p) => p.qty > 1e-12) };
}
