import { DeleteButton, Empty, PageHead, Panel, Pill } from "@/components/ui";
import { addAchievement, requestPublish, unpublish, verifyAchievement } from "@/lib/actions";
import { fmtDate } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function Vault() {
  const s = await readStore();
  return (
    <>
      <PageHead title="Achievement vault" intro="The only path to the public Achievements page: add it with evidence, verify it, request publishing, approve it." />
      <div className="grid side">
        <Panel title={`${s.achievements.length} achievements`}>
          {s.achievements.length === 0 ? <Empty title="Nothing in the vault yet">Add a result with a link that proves it: a leaderboard, certificate or acknowledgment page.</Empty> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Achievement</th><th>Date</th><th>Evidence</th><th>Verified</th><th>Public</th><th></th></tr></thead>
              <tbody>{s.achievements.map((a) => {
                const pending = s.approvals.some((x) => x.ref?.id === a.id && x.status === "pending");
                return (
                  <tr key={a.id}>
                    <td>{a.title}<div className="meta">{a.issuer}, {a.category}</div></td>
                    <td className="meta">{fmtDate(a.date)}</td>
                    <td>{a.evidenceUrl ? <a href={a.evidenceUrl}>link</a> : <span className="down">missing</span>}</td>
                    <td>
                      <form action={verifyAchievement}><input type="hidden" name="id" value={a.id} /><button className={`btn small${a.verified ? " quiet" : ""}`} type="submit">{a.verified ? "Verified ✓" : "Verify"}</button></form>
                    </td>
                    <td>{a.visibility === "public" ? <Pill tone="ok">public</Pill> : pending ? <Pill tone="warn">awaiting approval</Pill> : <Pill>private</Pill>}</td>
                    <td className="inline">
                      {a.visibility === "public" ? (
                        <form action={unpublish}><input type="hidden" name="type" value="achievement" /><input type="hidden" name="id" value={a.id} /><button className="btn quiet small" type="submit">Unpublish</button></form>
                      ) : a.verified && !pending ? (
                        <form action={requestPublish}><input type="hidden" name="type" value="achievement" /><input type="hidden" name="id" value={a.id} /><button className="btn small" type="submit">Request publish</button></form>
                      ) : null}
                      <DeleteButton collection="achievements" id={a.id} />
                    </td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
        </Panel>
        <Panel title="Add an achievement" sub="It starts private and unverified.">
          <form action={addAchievement} className="form">
            <label>Title<input type="text" name="title" required placeholder="e.g. Bronze medal, competition name" /></label>
            <div className="row">
              <label>Issuer<input type="text" name="issuer" placeholder="Kaggle, Devpost…" /></label>
              <label>Date<input type="date" name="date" required /></label>
            </div>
            <label>Category<select name="category">{["competition", "hackathon", "certification", "publication", "open-source", "other"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Evidence link<input type="url" name="evidenceUrl" required placeholder="https://" /></label>
            <label>Notes<textarea name="notes" rows={2} /></label>
            <div className="actions"><button className="btn" type="submit">Add to vault</button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}
