import { randomUUID } from "crypto";
import { DeleteButton, Empty, PageHead, Panel, Pill, Stats } from "@/components/ui";
import { addContest, submitCommand } from "@/lib/actions";
import { addProblem, reviewProblem } from "@/lib/actions-intel";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function Academy() {
  const s = await readStore();
  const tz = s.settings.timezone;
  const today = new Date().toISOString().slice(0, 10);
  const due = s.problems.filter((p) => p.nextReview <= today);
  const indep = s.problems.filter((p) => p.mode === "independent");
  const lc = indep.filter((p) => p.platform === "LeetCode").length;
  const topics = new Map<string, { n: number; assisted: number }>();
  for (const p of s.problems) for (const t of p.topics) {
    const v = topics.get(t) ?? { n: 0, assisted: 0 };
    v.n++; if (p.mode === "assisted") v.assisted++;
    topics.set(t, v);
  }
  const cf = s.codeforcesCache;
  return (
    <>
      <PageHead title="Competitive programming academy" intro="A tutor, not a contest bot. Nothing here helps during a live rated contest, and AI-assisted solves never count toward your targets." />
      <Stats items={[
        { label: "Solved independently", value: indep.length },
        { label: "Solved with help (tracked apart)", value: s.problems.length - indep.length },
        { label: "LeetCode toward 3,000", value: `${lc} / 3,000` },
        { label: "Reviews due today", value: due.length },
        { label: "Codeforces rating", value: cf ? (cf.rating ?? "unrated") : "—" },
      ]} />
      <div className="grid side">
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Reviews due" sub="Spaced repetition: 1, 3, 7, 14, 30, then 60 days. Forgetting one resets it.">
            {due.length === 0 ? <p className="muted">Nothing due. Log problems you solve and they'll come back for review.</p> : (
              <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {due.map((p) => (
                  <li key={p.id} className="inline" style={{ justifyContent: "space-between" }}>
                    <span>{p.ref.startsWith("http") ? <a href={p.ref}>{p.title}</a> : p.title} <span className="meta">{p.platform}, {p.topics.join(", ")}</span></span>
                    <span className="inline">
                      <form action={reviewProblem}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="result" value="recalled" /><button className="btn small" type="submit">Solved it again</button></form>
                      <form action={reviewProblem}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="result" value="forgot" /><button className="btn quiet small" type="submit">Needed a hint</button></form>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Topic map" sub="How many problems you've solved per topic. A high assisted share points to a weak area.">
            {topics.size === 0 ? <p className="muted">Add topics when you log problems (e.g. dp, graphs, greedy).</p> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Topic</th><th className="num">Solved</th><th className="num">Assisted</th><th style={{ width: "40%" }}>Independent share</th></tr></thead>
                <tbody>{[...topics.entries()].sort((a, b) => b[1].n - a[1].n).map(([t, v]) => (
                  <tr key={t}><td>{t}</td><td className="num">{v.n}</td><td className="num">{v.assisted}</td><td><div className="bar"><i style={{ width: `${((v.n - v.assisted) / v.n) * 100}%` }} /></div></td></tr>
                ))}</tbody>
              </table></div>
            )}
          </Panel>
          <Panel title="Solved problems" sub={`${s.problems.length} logged`}>
            {s.problems.length === 0 ? <Empty title="Nothing logged yet" /> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Problem</th><th>Platform</th><th>Difficulty</th><th>Mode</th><th>Solved</th><th>Next review</th><th></th></tr></thead>
                <tbody>{s.problems.slice(0, 100).map((p) => (
                  <tr key={p.id}>
                    <td>{p.ref.startsWith("http") ? <a href={p.ref}>{p.title}</a> : p.title}</td>
                    <td className="muted">{p.platform}</td><td className="muted">{p.difficulty}</td>
                    <td><Pill tone={p.mode === "independent" ? "ok" : "warn"}>{p.mode}</Pill></td>
                    <td className="meta">{fmtDate(p.solvedAt)}</td><td className="meta">{fmtDate(p.nextReview)}</td>
                    <td><DeleteButton collection="problems" id={p.id} /></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </Panel>
          <Panel title="Contest log" sub="Analysis only after a contest ends.">
            {s.contests.length === 0 ? <p className="muted">No contests logged.</p> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Contest</th><th>Platform</th><th>Date</th><th>Solved</th><th>Upsolve notes</th><th></th></tr></thead>
                <tbody>{s.contests.map((c) => <tr key={c.id}><td>{c.contest}</td><td className="muted">{c.platform}</td><td className="meta">{fmtDate(c.date)}</td><td>{c.solved}</td><td className="muted">{c.upsolveNotes}</td><td><DeleteButton collection="contests" id={c.id} /></td></tr>)}</tbody>
              </table></div>
            )}
          </Panel>
        </div>
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Log a solved problem">
            <form action={addProblem} className="form">
              <div className="row">
                <label>Platform<select name="platform"><option>LeetCode</option><option>Codeforces</option><option>AtCoder</option><option>USACO</option><option>Other</option></select></label>
                <label>How<select name="mode"><option value="independent">On my own</option><option value="assisted">With hints or AI</option></select></label>
              </div>
              <label>Problem id or link<input type="text" name="ref" required placeholder="two-sum or https://…" /></label>
              <label>Title<input type="text" name="title" /></label>
              <div className="row">
                <label>Difficulty<input type="text" name="difficulty" placeholder="Medium, 1400…" /></label>
                <label>Date solved<input type="date" name="solvedAt" /></label>
              </div>
              <label>Topics (comma-separated)<input type="text" name="topics" placeholder="dp, graphs" /></label>
              <div className="actions"><button className="btn" type="submit">Log problem</button></div>
            </form>
          </Panel>
          <Panel title="Codeforces" sub={cf ? `Synced ${fmtDateTime(cf.fetchedAt, tz)}` : s.settings.codeforcesHandle ? "Not synced yet" : "Add your handle in Settings"}>
            {cf && <p style={{ marginBottom: 10 }}>{cf.handle}: {cf.rating ?? "unrated"}{cf.rank ? ` (${cf.rank})` : ""}, {cf.contests} rated contests</p>}
            <form action={submitCommand}>
              <input type="hidden" name="command" value="Update my Codeforces rating" />
              <input type="hidden" name="idempotencyKey" value={randomUUID()} />
              <button className="btn small" type="submit" disabled={!s.settings.codeforcesHandle}>Sync rating</button>
            </form>
          </Panel>
          <Panel title="Log a contest">
            <form action={addContest} className="form">
              <div className="row">
                <label>Platform<select name="platform"><option>Codeforces</option><option>AtCoder</option><option>Other</option></select></label>
                <label>Date<input type="date" name="date" /></label>
              </div>
              <label>Contest<input type="text" name="contest" required /></label>
              <label>Solved<input type="text" name="solved" placeholder="A, B, C" /></label>
              <label>Upsolve notes<textarea name="upsolveNotes" rows={2} /></label>
              <div className="actions"><button className="btn" type="submit">Log contest</button></div>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
