import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Panel, Pill, VerificationPill } from "@/components/ui";
import { addMilestone, completeMilestone, updateCampaign } from "@/lib/actions-intel";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await readStore();
  const c = s.campaigns.find((x) => x.id === id);
  if (!c) notFound();
  const tz = s.settings.timezone;
  const events = s.events.filter((e) => e.campaignId === c.id).sort((a, b) => a.start.localeCompare(b.start)).filter((e) => Date.parse(e.start) > Date.now() - 86400000).slice(0, 10);
  const sources = s.sources.filter((x) => c.linkedSourceIds.includes(x.id));
  const lessons = s.lessons.filter((l) => l.campaignId === c.id);
  const isCp = c.id === "cmp.codeforces" || c.id === "cmp.atcoder" || c.id === "cmp.leetcode";
  const independent = s.problems.filter((p) => p.mode === "independent" && (c.id === "cmp.leetcode" ? p.platform === "LeetCode" : c.id === "cmp.codeforces" ? p.platform === "Codeforces" : p.platform === "AtCoder")).length;
  const cf = c.id === "cmp.codeforces" ? s.codeforcesCache : null;
  return (
    <>
      <p className="meta" style={{ marginBottom: 8 }}><Link href="/admin/campaigns">Campaigns</Link></p>
      <PageHead title={c.title} intro={`Target: ${c.target}. An ambitious goal, not a guaranteed outcome.`} />
      {c.restrictions && <p className="notice info">{c.restrictions}</p>}
      <div className="grid side">
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Status">
            <div className="grid two">
              <div className="stack" style={{ gap: 6 }}>
                <span className="meta">Official status (verified source only)</span>
                {c.officialStatus ? (
                  <><strong>{c.officialStatus}</strong><span className="meta"><a href={c.officialStatusEvidence}>evidence</a>, checked {fmtDateTime(c.officialStatusCheckedAt, tz)}</span></>
                ) : cf ? (
                  <><strong>Rating {cf.rating ?? "unrated"}{cf.maxRating ? ` (max ${cf.maxRating})` : ""}</strong><span className="meta">From the Codeforces API, {fmtDateTime(cf.fetchedAt, tz)}</span></>
                ) : (
                  <span className="muted">Not verified yet.</span>
                )}
                {isCp && <span className="meta">{independent} problems logged as solved independently</span>}
              </div>
              <div className="stack" style={{ gap: 6 }}>
                <span className="meta">Your own estimate (never shown as official)</span>
                <span>{c.internalEstimate || <span className="muted">None recorded.</span>}</span>
              </div>
            </div>
          </Panel>
          <Panel title="Milestones" sub="A milestone can only be completed with an evidence link.">
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 10 }}>
              {c.milestones.map((m) => (
                <li key={m.id} className="inline" style={{ justifyContent: "space-between" }}>
                  <span>{m.done ? <Pill tone="ok">done</Pill> : <Pill>open</Pill>} {m.title} {m.done && <a className="meta" href={m.evidenceUrl}>evidence</a>}</span>
                  <form action={completeMilestone} className="inline">
                    <input type="hidden" name="campaignId" value={c.id} />
                    <input type="hidden" name="id" value={m.id} />
                    {!m.done && <><label className="sr-only" htmlFor={`ev-${m.id}`}>Evidence link</label><input id={`ev-${m.id}`} type="url" name="evidenceUrl" placeholder="Evidence link" style={{ width: 200 }} /></>}
                    <button className="btn quiet small" type="submit">{m.done ? "Reopen" : "Complete"}</button>
                  </form>
                </li>
              ))}
              {c.milestones.length === 0 && <li className="muted">No milestones yet.</li>}
            </ul>
            <form action={addMilestone} className="inline" style={{ marginTop: 14 }}>
              <input type="hidden" name="campaignId" value={c.id} />
              <label className="sr-only" htmlFor="ms-title">New milestone</label>
              <input id="ms-title" type="text" name="title" placeholder="New milestone" required style={{ width: 280 }} />
              <button className="btn small" type="submit">Add milestone</button>
            </form>
          </Panel>
          <Panel title="Upcoming events">
            {events.length === 0 ? <p className="muted">Nothing on the calendar for this campaign.</p> : (
              <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {events.map((e) => <li key={e.id} className="inline" style={{ justifyContent: "space-between" }}><span>{e.title}</span><span className="meta">{fmtDateTime(e.start, tz)} <VerificationPill v={e.verification} /></span></li>)}
              </ul>
            )}
          </Panel>
          <Panel title="Lessons" action={<Link href="/admin/lessons">Decision memory</Link>}>
            {lessons.length === 0 ? <p className="muted">No lessons recorded for this campaign.</p> : (
              <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>{lessons.map((l) => <li key={l.id}>{l.attempted} <span className="meta">({fmtDate(l.createdAt)})</span></li>)}</ul>
            )}
          </Panel>
        </div>
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Plan">
            <form action={updateCampaign} className="form">
              <input type="hidden" name="id" value={c.id} />
              <label>Official status<input type="text" name="officialStatus" defaultValue={c.officialStatus} placeholder="e.g. Kaggle Expert (Competitions)" /></label>
              <label>Evidence link for official status<input type="url" name="officialStatusEvidence" defaultValue={c.officialStatusEvidence} placeholder="Your profile page" /></label>
              <label>Your own estimate<textarea name="internalEstimate" rows={2} defaultValue={c.internalEstimate} /></label>
              <label>Next action<input type="text" name="nextAction" defaultValue={c.nextAction} /></label>
              <div className="row">
                <label>Hours per week<input type="number" name="weeklyHours" min={0} max={80} defaultValue={c.weeklyHours} /></label>
                <label>Skills (comma-separated)<input type="text" name="skills" defaultValue={c.skills.join(", ")} /></label>
              </div>
              {c.requirementsUrl && (
                <label className="check"><input type="checkbox" name="requirementsChecked" /> I checked the current requirements on <a href={c.requirementsUrl}>the official page</a> today</label>
              )}
              <p className="meta">Requirements last checked: {c.requirementsCheckedAt ? fmtDateTime(c.requirementsCheckedAt, tz) : "never"}</p>
              <div className="actions"><button className="btn" type="submit">Save campaign</button></div>
            </form>
          </Panel>
          <Panel title="Sources">
            {sources.length === 0 ? <p className="muted">No linked sources.</p> : (
              <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {sources.map((x) => <li key={x.id}><a href={x.url}>{x.name}</a> <span className="meta">{x.access.replace("-", " ")}, {x.health}</span></li>)}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
