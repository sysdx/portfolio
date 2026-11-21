import Link from "next/link";
import { DeleteButton, Empty, PageHead, Panel, Pill } from "@/components/ui";
import { addHackathon, setHackathonStage } from "@/lib/actions";
import { fmtDate } from "@/lib/format";
import { readStore } from "@/lib/store";
import type { Hackathon } from "@/lib/types";

const STAGES: Hackathon["stage"][] = ["idea", "building", "testing", "demo", "submitted"];

export default async function Hackathons() {
  const s = await readStore();
  const radar = s.opportunities.filter((o) => o.kind === "hackathon" && o.status !== "skipped");
  return (
    <>
      <PageHead title="Hackathons" intro="From idea to submitted demo. You take part in every entry yourself; final submissions go through the approval center." />
      <Panel title="Pipeline">
        {s.hackathons.length === 0 ? <Empty title="No entries yet">Add a hackathon below. Check its eligibility and AI rules on the <Link href="/admin/intel">radar</Link> first.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Hackathon</th><th>Platform</th><th>Deadline</th><th>Stage</th><th>Move to</th><th></th></tr></thead>
              <tbody>
                {s.hackathons.map((h) => (
                  <tr key={h.id}>
                    <td>{h.url ? <a href={h.url}>{h.name}</a> : h.name}{h.notes && <div className="meta">{h.notes}</div>}</td>
                    <td className="muted">{h.platform}</td>
                    <td className="meta">{fmtDate(h.deadline)}</td>
                    <td><Pill tone={h.stage === "submitted" ? "ok" : "info"}>{h.stage}</Pill></td>
                    <td>
                      <form action={setHackathonStage} className="inline">
                        <input type="hidden" name="id" value={h.id} />
                        <select name="stage" defaultValue={h.stage} aria-label="Stage" style={{ width: "auto" }}>{STAGES.map((st) => <option key={st}>{st}</option>)}</select>
                        <button className="btn quiet small" type="submit">Update</button>
                      </form>
                    </td>
                    <td><DeleteButton collection="hackathons" id={h.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <div style={{ height: 16 }} />
      <div className="grid two">
        <Panel title="Add an entry">
          <form action={addHackathon} className="form">
            <label>Name<input type="text" name="name" required /></label>
            <div className="row">
              <label>Platform<input type="text" name="platform" defaultValue="Devpost" /></label>
              <label>Submission deadline<input type="date" name="deadline" /></label>
            </div>
            <label>Link<input type="url" name="url" /></label>
            <label>Notes<textarea name="notes" rows={2} /></label>
            <div className="actions"><button className="btn" type="submit">Add hackathon</button></div>
          </form>
        </Panel>
        <Panel title="On the radar" sub="Hackathons you're watching.">
          {radar.length === 0 ? <p className="muted">None yet.</p> : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {radar.map((o) => <li key={o.id}>{o.name} <span className="meta">{o.eligibility ? "eligibility recorded" : "eligibility unknown"}, {o.aiPolicy ? "AI policy recorded" : "AI policy unknown"}</span></li>)}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
