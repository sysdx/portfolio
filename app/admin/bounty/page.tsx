import { DeleteButton, Empty, PageHead, Panel, Pill } from "@/components/ui";
import { addBountyProgram, addBountyReport, confirmBountyAuthorization, setBountyReportStatus } from "@/lib/actions-intel";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";
import type { BountyReport } from "@/lib/types";

const REPORT_STATES: BountyReport["status"][] = ["draft", "submitted", "triaged", "accepted", "duplicate", "rejected"];

export default async function Bounty() {
  const s = await readStore();
  const tz = s.settings.timezone;
  const authorized = s.bountyPrograms.filter((p) => p.authorizationConfirmed);
  return (
    <>
      <PageHead title="Bug bounty workspace" intro="Authorization first. Nothing in Reputation OS scans or tests anyone's systems. This is where you record a program's rules and scope, keep notes, and track the reports you write yourself." />
      <p className="notice">Many programs have a minimum age or need a parent's consent. Record the program's age rule before anything else, and practice on legal training labs until you're eligible.</p>
      <div className="grid side">
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Programs">
            {s.bountyPrograms.length === 0 ? <Empty title="No programs recorded">Add a program with its official policy link, age requirement and scope.</Empty> : (
              <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 14 }}>
                {s.bountyPrograms.map((p) => (
                  <li key={p.id} className="panel" style={{ padding: 14 }}>
                    <div className="inline" style={{ justifyContent: "space-between" }}>
                      <strong>{p.url ? <a href={p.url}>{p.name}</a> : p.name}</strong>
                      {p.authorizationConfirmed ? <Pill tone="ok">authorized {fmtDate(p.confirmedAt)}</Pill> : <Pill tone="warn">{p.status}</Pill>}
                    </div>
                    <dl className="stack" style={{ margin: "10px 0", fontSize: "var(--t-sm)", gap: 6 }}>
                      <div><dt className="meta">Age requirement</dt><dd style={{ margin: 0 }}>{p.ageRequirement || <span className="down">not recorded</span>}</dd></div>
                      <div><dt className="meta">In scope</dt><dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{p.inScope || <span className="down">not recorded</span>}</dd></div>
                      <div><dt className="meta">Out of scope</dt><dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{p.outOfScope || "—"}</dd></div>
                      <div><dt className="meta">Rules and limits</dt><dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{p.rules || "—"}</dd></div>
                    </dl>
                    <form action={confirmBountyAuthorization} className="stack">
                      <input type="hidden" name="id" value={p.id} />
                      {!p.authorizationConfirmed && (
                        <>
                          <label className="check"><input type="checkbox" name="eligible" /> I meet this program's eligibility rules, including age</label>
                          <label className="check"><input type="checkbox" name="readRules" /> I've read its policy and will test only what's in scope, within its limits</label>
                        </>
                      )}
                      <div><button className={`btn small${p.authorizationConfirmed ? " quiet" : ""}`} type="submit">{p.authorizationConfirmed ? "Pause program" : "Confirm authorization"}</button></div>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Reports" sub="Responsible-disclosure drafts and their status.">
            {s.bountyReports.length === 0 ? <p className="muted">No reports.</p> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Report</th><th>Program</th><th>Created</th><th>Status</th><th></th></tr></thead>
                <tbody>{s.bountyReports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}{r.notes && <div className="meta" style={{ whiteSpace: "pre-wrap" }}>{r.notes.slice(0, 200)}</div>}</td>
                    <td className="muted">{s.bountyPrograms.find((p) => p.id === r.programId)?.name}</td>
                    <td className="meta">{fmtDateTime(r.createdAt, tz)}</td>
                    <td>
                      <form action={setBountyReportStatus} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <select name="status" defaultValue={r.status} aria-label="Report status" style={{ width: "auto" }}>{REPORT_STATES.map((st) => <option key={st}>{st}</option>)}</select>
                        <button className="btn quiet small" type="submit">Update</button>
                      </form>
                    </td>
                    <td><DeleteButton collection="bountyReports" id={r.id} /></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="meta" style={{ marginTop: 10 }}>An accepted report becomes an achievement once you add it to the vault with the program's acknowledgment as evidence.</p>
          </Panel>
        </div>
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Record a program">
            <form action={addBountyProgram} className="form">
              <label>Program name<input type="text" name="name" required /></label>
              <div className="row">
                <label>Platform<input type="text" name="platform" /></label>
                <label>Policy link<input type="url" name="url" placeholder="https://" /></label>
              </div>
              <label>Age requirement<input type="text" name="ageRequirement" placeholder="As stated in the program's terms" /></label>
              <label>In-scope targets<textarea name="inScope" rows={3} /></label>
              <label>Out of scope<textarea name="outOfScope" rows={2} /></label>
              <label>Rules, rate limits, testing restrictions<textarea name="rules" rows={3} /></label>
              <div className="actions"><button className="btn" type="submit">Save program</button></div>
            </form>
          </Panel>
          <Panel title="Draft a report" sub={authorized.length ? undefined : "Available after you authorize a program."}>
            <form action={addBountyReport} className="form">
              <label>Program<select name="programId" disabled={!authorized.length}>{authorized.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
              <label>Title<input type="text" name="title" required disabled={!authorized.length} /></label>
              <label>Notes<textarea name="notes" rows={4} disabled={!authorized.length} /></label>
              <div className="actions"><button className="btn" type="submit" disabled={!authorized.length}>Save draft</button></div>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
