import { DeleteButton, Empty, PageHead, Panel, Pill } from "@/components/ui";
import { addExperiment } from "@/lib/actions";
import { fmtDate } from "@/lib/format";
import { readStore } from "@/lib/store";

const PIPELINE = ["Check eligibility and rules", "Inspect data, target, metric and leakage risks", "Baselines and hypotheses", "Permitted experiments on isolated compute", "Compare out-of-fold and leaderboard", "Reviewed submission (needs your approval)", "Record lessons, publish permitted findings"];

export default async function Kaggle() {
  const s = await readStore();
  const kaggleSrc = s.sources.find((x) => x.id === "src.kaggle-api");
  const byComp = new Map<string, typeof s.experiments>();
  for (const e of s.experiments) byComp.set(e.competition || "Unassigned", [...(byComp.get(e.competition || "Unassigned") ?? []), e]);
  return (
    <>
      <PageHead title="Kaggle lab" intro="Experiment tracking for the three Kaggle campaigns. Every submission goes through the approval center." />
      <p className="notice">Connecting the Kaggle API (your token, server-side only) turns on automatic listing of competitions, kernels and submission scores. Until then, log experiments here by hand. Status: {kaggleSrc?.access === "needs-key" ? "not connected" : "connected"}.</p>
      <div className="grid side">
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Experiments" sub={`${s.experiments.length} logged`}>
            {s.experiments.length === 0 ? <Empty title="No experiments yet">Log your first run: what you tried, your cross-validation score and the leaderboard score.</Empty> : (
              [...byComp.entries()].map(([comp, list]) => (
                <div key={comp} style={{ marginBottom: 18 }}>
                  <h3 style={{ fontSize: "var(--t-sm)", marginBottom: 8 }}>{comp}</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Run</th><th>Approach</th><th className="num">CV</th><th className="num">LB</th><th>Status</th><th>Date</th><th></th></tr></thead>
                      <tbody>
                        {list.map((e) => (
                          <tr key={e.id}>
                            <td>{e.name}</td>
                            <td className="muted" style={{ maxWidth: 280 }}>{e.approach}{e.notes && <div className="meta">{e.notes}</div>}</td>
                            <td className="num">{e.cvScore || "—"}</td>
                            <td className="num">{e.lbScore || "—"}</td>
                            <td><Pill tone={e.status === "done" ? "ok" : e.status === "running" ? "info" : e.status === "abandoned" ? "plain" : ""}>{e.status}</Pill></td>
                            <td className="meta">{fmtDate(e.createdAt)}</td>
                            <td><DeleteButton collection="experiments" id={e.id} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </Panel>
          <Panel title="Competition pipeline" sub="The order each competition goes through. These steps get automated as integrations come online.">
            <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: "var(--t-sm)" }}>{PIPELINE.map((p) => <li key={p}>{p}</li>)}</ol>
            <p className="meta" style={{ marginTop: 12 }}>The Datasets and Code campaigns go by usefulness, not volume. Publishing lots of low-value work isn't a reliable route to medals.</p>
          </Panel>
        </div>
        <Panel title="Log an experiment">
          <form action={addExperiment} className="form">
            <label>Competition<input type="text" name="competition" placeholder="e.g. March Machine Learning Mania 2026" /></label>
            <label>Run name<input type="text" name="name" required /></label>
            <label>Approach<textarea name="approach" rows={3} /></label>
            <div className="row">
              <label>CV score<input type="text" name="cvScore" /></label>
              <label>LB score<input type="text" name="lbScore" /></label>
            </div>
            <label>Status<select name="status" defaultValue="done"><option>planned</option><option>running</option><option>done</option><option>abandoned</option></select></label>
            <label>Notes<textarea name="notes" rows={2} /></label>
            <div className="actions"><button className="btn" type="submit">Log experiment</button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}
