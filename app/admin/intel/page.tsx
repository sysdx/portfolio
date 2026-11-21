import { randomUUID } from "crypto";
import { DeleteButton, Empty, PageHead, Panel, Pill, VerificationPill } from "@/components/ui";
import { setOpportunityStatus, submitCommand } from "@/lib/actions";
import { addOpportunity, markSourceChecked } from "@/lib/actions-intel";
import { ago, fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";
import type { Opportunity } from "@/lib/types";

/** Transparent ranking: every point is explained. No win probabilities. */
function score(o: Opportunity) {
  const reasons: string[] = [];
  let n = 0;
  const pr = { high: 3, medium: 2, low: 1 }[o.priority];
  n += pr; reasons.push(`priority +${pr}`);
  if (o.eligibility) { n += 2; reasons.push("eligibility recorded +2"); } else reasons.push("eligibility unknown +0");
  if (o.aiPolicy) { n += 2; reasons.push("AI policy recorded +2"); } else reasons.push("AI policy unknown +0");
  if (o.verification === "verified") { n += 1; reasons.push("verified deadline +1"); }
  const days = o.deadline ? (Date.parse(o.deadline) - Date.now()) / 86400000 : null;
  if (days != null && days < 0) { n = 0; reasons.push("deadline passed"); }
  else if (days != null && days < 7) { n -= 1; reasons.push("under 7 days left -1"); }
  return { n, reasons, days };
}

function Cmd({ command, label }: { command: string; label: string }) {
  return (
    <form action={submitCommand}>
      <input type="hidden" name="command" value={command} />
      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
      <button className="btn small" type="submit">{label}</button>
    </form>
  );
}

export default async function Intel() {
  const s = await readStore();
  const tz = s.settings.timezone;
  const ranked = s.opportunities.map((o) => ({ o, ...score(o) })).sort((a, b) => (a.o.status === "skipped" ? 1 : 0) - (b.o.status === "skipped" ? 1 : 0) || b.n - a.n);
  return (
    <>
      <PageHead title="Sources & radar" intro="Every fact keeps its source, retrieval time and verification status. Stale or unconfirmed data is flagged instead of being treated as accurate.">
        <Cmd command="Check data freshness" label="Run freshness check" />
        <Cmd command="Import upcoming contests" label="Import contests" />
      </PageHead>

      <Panel title="Source registry">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Source</th><th>Authority</th><th>Access</th><th>Refresh</th><th>Permitted use</th><th>Health</th><th>Checked</th><th></th></tr></thead>
            <tbody>
              {s.sources.map((src) => (
                <tr key={src.id}>
                  <td><a href={src.url}>{src.name}</a></td>
                  <td className="muted">{src.authority}</td>
                  <td>{src.access === "needs-key" ? <Pill tone="warn">needs key</Pill> : <span className="muted">{src.access.replace("-", " ")}</span>}</td>
                  <td className="muted">{src.refresh}</td>
                  <td className="meta" style={{ maxWidth: 260 }}>{src.permittedUse}</td>
                  <td><Pill tone={src.health === "ok" ? "ok" : src.health === "error" ? "bad" : ""}>{src.health}</Pill>{src.lastError && <div className="meta">{src.lastError}</div>}</td>
                  <td className="meta">{ago(src.lastCheckedAt)}</td>
                  <td>{src.access === "manual-entry" && <form action={markSourceChecked}><input type="hidden" name="id" value={src.id} /><button className="btn quiet small" type="submit">Mark checked</button></form>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ height: 16 }} />
      <div className="grid side">
        <Panel title="Opportunity radar" sub="Ranked by a transparent score. It never estimates your chance of winning.">
          {ranked.length === 0 ? (
            <Empty title="No opportunities yet">Add a competition, hackathon, bounty program or research challenge. Its deadline gets a planning timeline on the calendar automatically.</Empty>
          ) : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 14 }}>
              {ranked.map(({ o, n, reasons, days }) => (
                <li key={o.id} className="panel" style={{ padding: 14, opacity: o.status === "skipped" ? 0.55 : 1 }}>
                  <div className="inline" style={{ justifyContent: "space-between" }}>
                    <strong>{o.url ? <a href={o.url}>{o.name}</a> : o.name}</strong>
                    <span className="inline"><Pill tone="info">score {n}</Pill><Pill>{o.kind}</Pill><Pill tone={o.status === "entered" ? "ok" : ""}>{o.status}</Pill></span>
                  </div>
                  <p className="meta" style={{ margin: "6px 0" }}>{o.platform}{o.deadline ? `, deadline ${fmtDateTime(o.deadline, tz)}${days != null && days >= 0 ? ` (${Math.ceil(days)} days)` : ""}` : ", no deadline recorded"} <VerificationPill v={o.verification} /></p>
                  <dl className="stack" style={{ margin: "8px 0", fontSize: "var(--t-sm)", gap: 4 }}>
                    <div><dt className="meta" style={{ display: "inline" }}>Eligibility: </dt><dd style={{ display: "inline", margin: 0 }}>{o.eligibility || <span className="down">not recorded</span>}</dd></div>
                    <div><dt className="meta" style={{ display: "inline" }}>AI-use policy: </dt><dd style={{ display: "inline", margin: 0 }}>{o.aiPolicy || <span className="down">not recorded</span>}</dd></div>
                  </dl>
                  <p className="meta">Score: {reasons.join(", ")}</p>
                  <div className="inline" style={{ marginTop: 10 }}>
                    {(["watching", "entered", "skipped"] as const).filter((st) => st !== o.status).map((st) => (
                      <form key={st} action={setOpportunityStatus}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value={st} /><button className="btn quiet small" type="submit">Mark {st}</button></form>
                    ))}
                    <DeleteButton collection="opportunities" id={o.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Add an opportunity" sub="You can't mark it entered until eligibility and the AI policy are recorded.">
          <form action={addOpportunity} className="form">
            <label>Name<input type="text" name="name" required /></label>
            <div className="row">
              <label>Kind<select name="kind"><option>competition</option><option>hackathon</option><option>bounty</option><option>research</option></select></label>
              <label>Platform<input type="text" name="platform" placeholder="Kaggle, Devpost…" /></label>
            </div>
            <label>Link<input type="url" name="url" placeholder="https://" /></label>
            <label>Deadline ({tz})<input type="datetime-local" name="deadline" /></label>
            <div className="row">
              <label>Deadline is<select name="verification" defaultValue="unconfirmed"><option value="verified">verified</option><option value="estimated">estimated</option><option value="unconfirmed">unconfirmed</option></select></label>
              <label>Priority<select name="priority" defaultValue="medium"><option>high</option><option>medium</option><option>low</option></select></label>
            </div>
            <label>Official rules page<input type="url" name="sourceUrl" placeholder="Required for a verified deadline" /></label>
            <label>Eligibility (age, location, team)<textarea name="eligibility" rows={2} /></label>
            <label>AI-use policy<textarea name="aiPolicy" rows={2} /></label>
            <label>Campaign<select name="campaignId" defaultValue=""><option value="">None</option>{s.campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
            <div className="actions"><button className="btn" type="submit">Add to radar</button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}
