import { randomUUID } from "crypto";
import Link from "next/link";
import { DeleteButton, Empty, PageHead, Panel, Pill, VerificationPill } from "@/components/ui";
import { addEvent, moveEvent } from "@/lib/actions-intel";
import { submitCommand } from "@/lib/actions";
import { dayKey, fmtDateTime, fmtTime, toLocalInput } from "@/lib/format";
import { readStore } from "@/lib/store";
import type { CalendarEvent } from "@/lib/types";

type View = "week" | "month" | "agenda" | "deadlines";
type Occurrence = CalendarEvent & { occStart: string; conflict: boolean };

const DAY = 86400000;

function expand(events: CalendarEvent[], from: number, to: number): Occurrence[] {
  const out: Occurrence[] = [];
  for (const e of events) {
    const base = Date.parse(e.start);
    if (e.recurrence === "weekly") {
      let t = base;
      if (t < from) t += Math.ceil((from - t) / (7 * DAY)) * 7 * DAY;
      for (; t <= to; t += 7 * DAY) out.push({ ...e, occStart: new Date(t).toISOString(), conflict: false });
    } else if (base >= from && base <= to) {
      out.push({ ...e, occStart: e.start, conflict: false });
    }
  }
  out.sort((a, b) => a.occStart.localeCompare(b.occStart));
  // Conflict detection: overlapping time ranges (1 hour default when no end).
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    const aEnd = Date.parse(a.occStart) + (a.end ? Date.parse(a.end) - Date.parse(a.start) : 3600000);
    for (let j = i + 1; j < out.length && Date.parse(out[j].occStart) < aEnd; j++) {
      if (a.kind === "approval" || out[j].kind === "approval") continue; // reminders don't block time
      a.conflict = out[j].conflict = true;
    }
  }
  return out;
}

function startOfWeek(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7; // Monday first
  return new Date(x.getTime() - dow * DAY);
}

function Ev({ e, tz }: { e: Occurrence; tz: string }) {
  return (
    <a href={`#ev-${e.id}`} className={`ev k-${e.kind} v-${e.verification}${e.conflict ? " conflict" : ""}`} title={`${e.title} (${e.verification}${e.conflict ? ", conflicts with another event" : ""})`}>
      <time>{fmtTime(e.occStart, tz)}</time>
      {e.title}
    </a>
  );
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; d?: string }> }) {
  const sp = await searchParams;
  const view = (["week", "month", "agenda", "deadlines"].includes(sp.view ?? "") ? sp.view : "week") as View;
  const s = await readStore();
  const tz = s.settings.timezone;
  const anchor = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? new Date(`${sp.d}T12:00:00Z`) : new Date(`${dayKey(new Date(), tz)}T12:00:00Z`);
  const today = dayKey(new Date(), tz);

  let days: Date[] = [];
  let prev: string;
  let next: string;
  let label: string;
  if (view === "month") {
    const first = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 12));
    const gridStart = startOfWeek(first);
    days = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getTime() + i * DAY + 12 * 3600000));
    prev = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1, 12)).toISOString().slice(0, 10);
    next = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1, 12)).toISOString().slice(0, 10);
    label = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  } else {
    const ws = startOfWeek(anchor);
    days = Array.from({ length: 7 }, (_, i) => new Date(ws.getTime() + i * DAY + 12 * 3600000));
    prev = new Date(ws.getTime() - 7 * DAY + 12 * 3600000).toISOString().slice(0, 10);
    next = new Date(ws.getTime() + 7 * DAY + 12 * 3600000).toISOString().slice(0, 10);
    label = `Week of ${ws.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
  }
  const rangeFrom = days[0].getTime() - 14 * 3600000;
  const rangeTo = days[days.length - 1].getTime() + 14 * 3600000;
  const occ = expand(s.events, view === "agenda" || view === "deadlines" ? Date.now() - DAY : rangeFrom, view === "agenda" || view === "deadlines" ? Date.now() + 90 * DAY : rangeTo);
  const byDay = new Map<string, Occurrence[]>();
  for (const o of occ) {
    const k = dayKey(o.occStart, tz);
    byDay.set(k, [...(byDay.get(k) ?? []), o]);
  }
  const conflicts = occ.filter((o) => o.conflict).length;
  const listed = view === "deadlines" ? occ.filter((o) => ["deadline", "registration", "contest"].includes(o.kind)) : occ;
  const q = (v: View, d?: string) => `/admin/calendar?view=${v}${d ? `&d=${d}` : ""}`;
  const campaigns = s.campaigns;

  return (
    <>
      <PageHead title="Calendar" intro={`Times shown in ${tz}. Solid edges are verified dates; dashed edges are estimated or unconfirmed.`}>
        <nav className="tabs" aria-label="Calendar view">
          {(["week", "month", "agenda", "deadlines"] as View[]).map((v) => (
            <Link key={v} href={q(v)} aria-current={view === v ? "true" : undefined}>{v[0].toUpperCase() + v.slice(1)}</Link>
          ))}
        </nav>
      </PageHead>
      {conflicts > 0 && <p className="notice">{conflicts} events overlap with another one. They're outlined in red.</p>}

      <Panel
        title={view === "week" || view === "month" ? label : view === "agenda" ? "Next 90 days" : "Deadlines, registrations and contests"}
        action={
          <div className="inline">
            {(view === "week" || view === "month") && (
              <>
                <Link className="btn quiet small" href={q(view, prev)}>Previous</Link>
                <Link className="btn quiet small" href={q(view)}>Today</Link>
                <Link className="btn quiet small" href={q(view, next)}>Next</Link>
              </>
            )}
            <form action={submitCommand}>
              <input type="hidden" name="command" value="Import upcoming contests" />
              <input type="hidden" name="idempotencyKey" value={randomUUID()} />
              <button className="btn small" type="submit">Import Codeforces contests</button>
            </form>
          </div>
        }
      >
        {view === "week" && (
          <div className="cal-week">
            {days.map((d) => {
              const k = d.toISOString().slice(0, 10);
              const evs = byDay.get(k) ?? [];
              return (
                <div key={k} className={`cal-day${k === today ? " today" : ""}`}>
                  <h3>{d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</h3>
                  {evs.map((e) => <Ev key={e.id + e.occStart} e={e} tz={tz} />)}
                </div>
              );
            })}
          </div>
        )}
        {view === "month" && (
          <div className="cal-month">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {days.map((d) => {
              const k = d.toISOString().slice(0, 10);
              const evs = byDay.get(k) ?? [];
              return (
                <div key={k} className={`cal-day${k === today ? " today" : ""}${d.getUTCMonth() !== anchor.getUTCMonth() ? " out" : ""}`}>
                  <h3>{d.getUTCDate()}</h3>
                  {evs.slice(0, 3).map((e) => <Ev key={e.id + e.occStart} e={e} tz={tz} />)}
                  {evs.length > 3 && <span className="meta">+{evs.length - 3} more</span>}
                </div>
              );
            })}
          </div>
        )}
        {(view === "agenda" || view === "deadlines") &&
          (listed.length === 0 ? (
            <Empty title="Nothing coming up">Import contests or add an event below.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>When</th><th>Event</th><th>Kind</th><th>Verification</th><th>Source</th></tr></thead>
                <tbody>
                  {listed.map((e) => (
                    <tr key={e.id + e.occStart}>
                      <td className="meta" style={{ whiteSpace: "nowrap" }}>{fmtDateTime(e.occStart, tz)}</td>
                      <td>{e.title}{e.conflict && <> <Pill tone="bad">conflict</Pill></>}{e.history.length > 0 && <> <Pill tone="warn">changed {e.history.length}×</Pill></>}</td>
                      <td className="muted">{e.kind}</td>
                      <td><VerificationPill v={e.verification} /></td>
                      <td>{e.sourceUrl ? <a href={e.sourceUrl}>source</a> : <span className="meta">manual</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </Panel>

      <div style={{ height: 16 }} />
      <div className="grid two">
        <Panel title="Add an event" sub="A date counts as verified only with an official source link.">
          <form action={addEvent} className="form">
            <label>Title<input type="text" name="title" required /></label>
            <div className="row">
              <label>Starts<input type="datetime-local" name="start" required /></label>
              <label>Ends<input type="datetime-local" name="end" /></label>
            </div>
            <div className="row">
              <label>Kind
                <select name="kind" defaultValue="training">
                  {["contest", "deadline", "registration", "training", "research", "publishing", "approval", "other"].map((k) => <option key={k}>{k}</option>)}
                </select>
              </label>
              <label>Repeats
                <select name="recurrence" defaultValue="none"><option value="none">Doesn't repeat</option><option value="weekly">Weekly</option></select>
              </label>
            </div>
            <div className="row">
              <label>Verification
                <select name="verification" defaultValue="unconfirmed"><option>verified</option><option>estimated</option><option>unconfirmed</option></select>
              </label>
              <label>Campaign
                <select name="campaignId" defaultValue=""><option value="">None</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
              </label>
            </div>
            <label>Official source link<input type="url" name="sourceUrl" placeholder="https://" /></label>
            <label>Notes<input type="text" name="notes" /></label>
            <div className="actions"><button className="btn" type="submit">Add event</button></div>
          </form>
        </Panel>
        <Panel title="Event details" sub="History keeps every change to an event's time or title.">
          {occ.length === 0 ? (
            <p className="muted">No events in this range.</p>
          ) : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 14, maxHeight: 640, overflowY: "auto" }}>
              {[...new Map(occ.map((o) => [o.id, o])).values()].map((e) => (
                <li key={e.id} id={`ev-${e.id}`} className="stack" style={{ gap: 6, borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                  <strong style={{ fontSize: "var(--t-sm)" }}>{e.title}</strong>
                  <span className="meta">{fmtDateTime(e.start, tz)}{e.end ? ` to ${fmtTime(e.end, tz)}` : ""}, {e.kind}{e.recurrence === "weekly" ? ", weekly" : ""}</span>
                  <span className="meta"><VerificationPill v={e.verification} /> {e.sourceUrl ? <a href={e.sourceUrl}>source</a> : "no source"}, retrieved {fmtDateTime(e.retrievedAt, tz)}</span>
                  {e.notes && <span className="meta">{e.notes.startsWith("http") ? <a href={e.notes}>{e.notes}</a> : e.notes}</span>}
                  {e.history.length > 0 && (
                    <details className="disclose"><summary>History ({e.history.length})</summary>
                      <ul className="meta" style={{ margin: 0, paddingLeft: 16 }}>
                        {e.history.map((h, i) => <li key={i}>{fmtDateTime(h.at, tz)}: {h.field} changed from {h.field === "start" || h.field === "end" ? fmtDateTime(h.from, tz) : h.from} to {h.field === "start" || h.field === "end" ? fmtDateTime(h.to, tz) : h.to} ({h.by})</li>)}
                      </ul>
                    </details>
                  )}
                  <div className="inline">
                    <form action={moveEvent} className="inline">
                      <input type="hidden" name="id" value={e.id} />
                      <label className="sr-only" htmlFor={`mv-${e.id}`}>New start</label>
                      <input id={`mv-${e.id}`} type="datetime-local" name="start" defaultValue={toLocalInput(e.start, tz)} style={{ width: "auto" }} />
                      <button className="btn quiet small" type="submit">Move</button>
                    </form>
                    <DeleteButton collection="events" id={e.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
