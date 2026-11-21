export function fmtDate(iso: string | null | undefined, tz = "America/New_York"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  // A bare calendar date ("2026-09-08") has no time zone: show it as written.
  const zone = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? "UTC" : tz;
  return d.toLocaleDateString("en-US", { timeZone: zone, month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined, tz = "America/New_York"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function fmtTime(iso: string, tz = "America/New_York"): string {
  return new Date(iso).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" });
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return "never";
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function usd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function compactUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 });
}

export function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/** "2026-12-01T17:00" in tz, for datetime-local inputs. */
export function toLocalInput(iso: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** YYYY-MM-DD of an instant in tz. */
export function dayKey(iso: string | Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(typeof iso === "string" ? new Date(iso) : iso);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}`;
}

/** Converts a datetime-local value ("2026-12-01T17:00") in the given IANA zone to an ISO instant. */
export function zonedToIso(local: string, timeZone: string): string {
  if (!local) return "";
  const asUtc = new Date(`${local.length === 10 ? `${local}T00:00` : local}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(asUtc);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const zoned = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offset = zoned - asUtc.getTime();
  return new Date(asUtc.getTime() - offset).toISOString();
}
