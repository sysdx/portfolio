import { PageHead, Panel, Pill } from "@/components/ui";
import { addLesson } from "@/lib/actions-intel";
import { fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function Lessons() {
  const s = await readStore();
  const tz = s.settings.timezone;
  return (
    <>
      <PageHead title="Decision memory" intro="What was tried, what happened and what to change. Lessons are append-only: nothing here can be edited or deleted, so history can't be rewritten to look better." />
      <div className="grid side">
        <Panel title={`${s.lessons.length} lessons`}>
          {s.lessons.length === 0 ? <p className="muted">No lessons yet. Record one after an experiment, contest or project.</p> : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 16 }}>
              {s.lessons.map((l) => (
                <li key={l.id} className="panel" style={{ padding: 14 }}>
                  <div className="inline" style={{ justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "var(--t-sm)" }}>{l.attempted}</strong>
                    <span className="inline">{l.verified ? <Pill tone="ok">verified</Pill> : <Pill>unverified</Pill>}<span className="meta">{fmtDateTime(l.createdAt, tz)}</span></span>
                  </div>
                  <dl className="stack" style={{ margin: "10px 0 0", fontSize: "var(--t-sm)", gap: 6 }}>
                    {l.campaignId && <div><dt className="meta">Campaign</dt><dd style={{ margin: 0 }}>{s.campaigns.find((c) => c.id === l.campaignId)?.title}</dd></div>}
                    {l.toolsAndSources && <div><dt className="meta">Tools and sources</dt><dd style={{ margin: 0 }}>{l.toolsAndSources}</dd></div>}
                    {l.happened && <div><dt className="meta">What happened</dt><dd style={{ margin: 0 }}>{l.happened}</dd></div>}
                    {l.evidence && <div><dt className="meta">Evidence</dt><dd style={{ margin: 0 }}>{l.evidence}</dd></div>}
                    {l.failed && <div><dt className="meta">What failed</dt><dd style={{ margin: 0 }}>{l.failed}</dd></div>}
                    {l.changeNext && <div><dt className="meta">Change next time</dt><dd style={{ margin: 0 }}>{l.changeNext}</dd></div>}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Record a lesson">
          <form action={addLesson} className="form">
            <label>What was attempted<input type="text" name="attempted" required /></label>
            <label>Campaign<select name="campaignId" defaultValue=""><option value="">None</option>{s.campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
            <label>Tools and sources used<input type="text" name="toolsAndSources" /></label>
            <label>What actually happened<textarea name="happened" rows={3} /></label>
            <label>Evidence<input type="text" name="evidence" placeholder="Link, score, commit…" /></label>
            <label className="check"><input type="checkbox" name="verified" /> The result was independently verified</label>
            <label>What failed<textarea name="failed" rows={2} /></label>
            <label>What to change next time<textarea name="changeNext" rows={2} /></label>
            <div className="actions"><button className="btn" type="submit">Save lesson</button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}
