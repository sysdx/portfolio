import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Panel, Pill, TaskPill } from "@/components/ui";
import { approveTaskAction, cancelTaskAction, markTaskDoneAction, reassignTaskAction, runTaskAction } from "@/lib/actions";
import { fmtDateTime } from "@/lib/format";
import { getOperation } from "@/lib/operations";
import { getRole, ROLES } from "@/lib/org";
import { readStore } from "@/lib/store";
import type { GateId } from "@/lib/types";

const GATE_ORDER: Array<{ id: GateId; label: string }> = [
  { id: "requirements", label: "Requirements" },
  { id: "implementation", label: "Implementation" },
  { id: "automated-tests", label: "Automated tests" },
  { id: "independent-review", label: "Independent review" },
  { id: "policy", label: "Security & policy" },
  { id: "human-approval", label: "Your approval" },
  { id: "verification", label: "Verification" },
];

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await readStore();
  const t = s.tasks.find((x) => x.id === id);
  if (!t) notFound();
  const tz = s.settings.timezone;
  const op = getOperation(t.operation);
  const owner = getRole(t.ownerRoleId);
  const reviewer = getRole(t.reviewerRoleId);
  const open = !["done", "cancelled"].includes(t.status);
  return (
    <>
      <p className="meta" style={{ marginBottom: 8 }}><Link href="/admin/tasks">Task ledger</Link></p>
      <PageHead title={t.title} intro={<>From {t.source}: “{t.command}”</>}>
        <TaskPill status={t.status} />
      </PageHead>

      <div className="grid side">
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Quality gates" sub="A failed gate sends the task back with the reason. No role approves its own work.">
            <ol className="gates">
              {GATE_ORDER.map((g) => {
                const results = t.gates.filter((x) => x.gate === g.id);
                const last = results.at(-1);
                const skipped = g.id === "human-approval" && !last && t.status === "done";
                return (
                  <li key={g.id}>
                    <span className={`dot ${last ? (last.passed ? "pass" : "fail") : "wait"}`} aria-hidden="true">{last ? (last.passed ? "✓" : "×") : "·"}</span>
                    <div>
                      <strong style={{ fontSize: "var(--t-sm)" }}>{g.label}</strong>{" "}
                      {last ? <span className="meta">by {last.by === "founder" || last.by === "system" ? last.by : getRole(last.by)?.title ?? last.by}, {fmtDateTime(last.at, tz)}</span> : <span className="meta">{skipped ? "not required for this task" : "not reached"}</span>}
                      {last && <p className="muted" style={{ fontSize: "var(--t-sm)" }}>{last.note}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>
          <Panel title="Evidence" sub="What the operation actually returned.">
            {t.evidence.length === 0 ? (
              <p className="muted">No evidence yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <tbody>
                    {t.evidence.map((e, i) => (
                      <tr key={i}><td className="muted" style={{ width: "34%" }}>{e.label}</td><td style={{ wordBreak: "break-word" }}>{e.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <Panel title="Execution log">
            <pre className="log">{t.log.join("\n")}</pre>
          </Panel>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Details">
            <dl className="stack" style={{ margin: 0, fontSize: "var(--t-sm)" }}>
              <div><dt className="meta">Owner</dt><dd style={{ margin: 0 }}>{owner ? <Link href={`/admin/org/${owner.department}#${owner.id}`}>{owner.title}</Link> : t.ownerRoleId}</dd></div>
              <div><dt className="meta">Independent reviewer</dt><dd style={{ margin: 0 }}>{reviewer?.title ?? t.reviewerRoleId}</dd></div>
              <div><dt className="meta">Operation</dt><dd style={{ margin: 0 }}>{op ? <><code>{op.id}</code> <span className="muted">{op.description}</span></> : "Manual task"}</dd></div>
              <div><dt className="meta">Risk</dt><dd style={{ margin: 0 }}><Pill tone={t.risk === "low" ? "ok" : t.risk === "medium" ? "warn" : "bad"}>{t.risk}</Pill></dd></div>
              <div><dt className="meta">Done when</dt><dd style={{ margin: 0 }}>{t.completionCriteria}</dd></div>
              <div><dt className="meta">Attempts</dt><dd style={{ margin: 0 }}>{t.attempts}</dd></div>
              <div><dt className="meta">Idempotency key</dt><dd style={{ margin: 0 }}><code style={{ fontSize: "var(--t-xs)" }}>{t.idempotencyKey}</code></dd></div>
            </dl>
          </Panel>
          {open && (
            <Panel title="Controls">
              <div className="stack">
                {t.status === "awaiting-approval" && op && (
                  <form action={approveTaskAction}><input type="hidden" name="id" value={t.id} /><button className="btn" type="submit">Approve and run</button></form>
                )}
                {op && ["planned", "returned", "failed"].includes(t.status) && !t.needsApproval && (
                  <form action={runTaskAction}><input type="hidden" name="id" value={t.id} /><button className="btn" type="submit">{t.attempts ? "Retry" : "Run now"}</button></form>
                )}
                {!op && (
                  <form action={markTaskDoneAction} className="form">
                    <input type="hidden" name="id" value={t.id} />
                    <label>Result note<input type="text" name="note" placeholder="What was delivered" /></label>
                    <button className="btn" type="submit">Mark done</button>
                  </form>
                )}
                <form action={reassignTaskAction} className="form">
                  <input type="hidden" name="id" value={t.id} />
                  <label>Reassign to
                    <select name="ownerRoleId" defaultValue={t.ownerRoleId}>
                      {ROLES.filter((r) => r.id !== t.reviewerRoleId).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                    </select>
                  </label>
                  <button className="btn quiet" type="submit">Reassign</button>
                </form>
                <form action={cancelTaskAction}><input type="hidden" name="id" value={t.id} /><button className="btn danger" type="submit">Cancel task</button></form>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
