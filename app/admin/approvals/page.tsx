import Link from "next/link";
import { Empty, PageHead, Panel, Pill } from "@/components/ui";
import { approveTaskAction, cancelTaskAction, decideApproval } from "@/lib/actions";
import { fmtDateTime } from "@/lib/format";
import { getRole } from "@/lib/org";
import { readStore } from "@/lib/store";

export default async function Approvals() {
  const s = await readStore();
  const tz = s.settings.timezone;
  const pending = s.approvals.filter((a) => a.status === "pending");
  const tasks = s.tasks.filter((t) => t.status === "awaiting-approval");
  const decided = s.approvals.filter((a) => a.status !== "pending").slice(0, 20);
  return (
    <>
      <PageHead title="Approval center" intro="Anything public, external or costly waits here for your yes. Nothing on this list happens without it." />
      <div className="grid two">
        <Panel title="Publications and actions" sub={`${pending.length} pending`}>
          {pending.length === 0 ? (
            <Empty title="Nothing to approve" />
          ) : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 14 }}>
              {pending.map((a) => (
                <li key={a.id} className="panel" style={{ padding: 14 }}>
                  <div className="inline" style={{ justifyContent: "space-between" }}>
                    <strong style={{ fontSize: "var(--t-sm)" }}>{a.title}</strong>
                    <Pill tone="warn">{a.kind}</Pill>
                  </div>
                  <p className="muted" style={{ fontSize: "var(--t-sm)", margin: "8px 0", whiteSpace: "pre-wrap" }}>{a.detail}</p>
                  <p className="meta">Requested {fmtDateTime(a.createdAt, tz)}{a.costUsd ? `, cost $${a.costUsd}` : ""}</p>
                  <div className="inline" style={{ marginTop: 10 }}>
                    <form action={decideApproval}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="decision" value="approve" /><button className="btn small" type="submit">Approve</button></form>
                    <form action={decideApproval}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="decision" value="reject" /><button className="btn quiet small" type="submit">Reject</button></form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Tasks waiting to run" sub="Held because of the autonomy level or because they act outside the system.">
          {tasks.length === 0 ? (
            <Empty title="No tasks waiting" />
          ) : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 14 }}>
              {tasks.map((t) => (
                <li key={t.id} className="panel" style={{ padding: 14 }}>
                  <Link href={`/admin/tasks/${t.id}`}>{t.title}</Link>
                  <p className="meta" style={{ margin: "6px 0 10px" }}>Owner: {getRole(t.ownerRoleId)?.title}, reviewer: {getRole(t.reviewerRoleId)?.title}</p>
                  <div className="inline">
                    <form action={approveTaskAction}><input type="hidden" name="id" value={t.id} /><button className="btn small" type="submit">Approve and run</button></form>
                    <form action={cancelTaskAction}><input type="hidden" name="id" value={t.id} /><button className="btn quiet small" type="submit">Decline</button></form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <div style={{ height: 16 }} />
      <Panel title="Decision history">
        {decided.length === 0 ? (
          <p className="muted">No decisions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Decision</th><th>When</th></tr></thead>
              <tbody>
                {decided.map((a) => (
                  <tr key={a.id}><td>{a.title}</td><td><Pill tone={a.status === "approved" ? "ok" : "bad"}>{a.status}</Pill></td><td className="meta">{fmtDateTime(a.decidedAt, tz)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
