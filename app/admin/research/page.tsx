import { DeleteButton, Empty, PageHead, Panel, Pill } from "@/components/ui";
import { addResearch, requestPublish, unpublish } from "@/lib/actions";
import { readStore } from "@/lib/store";

export default async function Research() {
  const s = await readStore();
  return (
    <>
      <PageHead title="Research" intro="Reports, benchmarks and datasets. A public item needs a source link and your approval." />
      <div className="grid side">
        <Panel title={`${s.research.length} items`}>
          {s.research.length === 0 ? <Empty title="Nothing yet">Add a report or benchmark with its repository link.</Empty> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Title</th><th>Kind</th><th>Status</th><th>Visibility</th><th></th></tr></thead>
              <tbody>{s.research.map((r) => {
                const pending = s.approvals.some((a) => a.ref?.id === r.id && a.status === "pending");
                return (
                  <tr key={r.id}>
                    <td>{r.repoUrl ? <a href={r.repoUrl}>{r.title}</a> : r.title}{r.summary && <div className="meta">{r.summary}</div>}</td>
                    <td className="muted">{r.kind}</td><td className="muted">{r.status}</td>
                    <td>{r.visibility === "public" ? <Pill tone="ok">public</Pill> : pending ? <Pill tone="warn">awaiting approval</Pill> : <Pill>private</Pill>}</td>
                    <td className="inline">
                      {r.visibility === "public" ? (
                        <form action={unpublish}><input type="hidden" name="type" value="research" /><input type="hidden" name="id" value={r.id} /><button className="btn quiet small" type="submit">Unpublish</button></form>
                      ) : !pending && r.repoUrl ? (
                        <form action={requestPublish}><input type="hidden" name="type" value="research" /><input type="hidden" name="id" value={r.id} /><button className="btn small" type="submit">Request publish</button></form>
                      ) : null}
                      <DeleteButton collection="research" id={r.id} />
                    </td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
        </Panel>
        <Panel title="Add research">
          <form action={addResearch} className="form">
            <label>Title<input type="text" name="title" required /></label>
            <div className="row">
              <label>Kind<select name="kind"><option>report</option><option>benchmark</option><option>dataset</option><option>reading</option></select></label>
              <label>Status<select name="status"><option>idea</option><option>in-progress</option><option>done</option></select></label>
            </div>
            <label>Repository or data link<input type="url" name="repoUrl" /></label>
            <label>Summary<textarea name="summary" rows={3} /></label>
            <div className="actions"><button className="btn" type="submit">Add</button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}
