import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Panel, Pill, TaskPill } from "@/components/ui";
import { ago } from "@/lib/format";
import { getOperation } from "@/lib/operations";
import { DEPARTMENTS, getRole, rolesIn } from "@/lib/org";
import { readStore } from "@/lib/store";
import type { DepartmentId } from "@/lib/types";

export default async function DepartmentPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const d = DEPARTMENTS.find((x) => x.id === dept);
  if (!d) notFound();
  const s = await readStore();
  const roles = rolesIn(d.id as DepartmentId);
  const tasks = s.tasks.filter((t) => roles.some((r) => r.id === t.ownerRoleId || r.id === t.reviewerRoleId));
  const owned = tasks.filter((t) => roles.some((r) => r.id === t.ownerRoleId));
  const done = owned.filter((t) => t.status === "done").length;
  return (
    <>
      <p className="meta" style={{ marginBottom: 8 }}><Link href="/admin/org">Organization</Link></p>
      <PageHead title={d.name} intro={d.deliverable} />
      <div className="grid side">
        <Panel title="Roles">
          <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 12 }}>
            {roles.map((r) => (
              <li key={r.id} id={r.id}>
                <details className="disclose">
                  <summary>
                    <span className="inline" style={{ gap: 8 }}>
                      <strong style={{ color: "var(--text)" }}>{r.title}</strong>
                      {r.id === d.headRoleId && <Pill tone="info">head</Pill>}
                      {r.tools.length > 0 && <Pill tone="ok">live</Pill>}
                      {r.defined === "proposed" && <Pill>proposed</Pill>}
                    </span>
                  </summary>
                  <dl className="stack" style={{ margin: 0, fontSize: "var(--t-sm)" }}>
                    <div><dt className="meta">Role id</dt><dd style={{ margin: 0 }}><code>{r.id}</code> (instructions {r.instructionsVersion})</dd></div>
                    <div><dt className="meta">Reports to</dt><dd style={{ margin: 0 }}>{r.managerId ? getRole(r.managerId)?.title : "You"}</dd></div>
                    <div><dt className="meta">Responsibilities</dt><dd style={{ margin: 0 }}>{r.responsibilities.join("; ")}</dd></div>
                    <div><dt className="meta">Never does</dt><dd style={{ margin: 0 }}>{r.exclusions.join("; ")}</dd></div>
                    <div><dt className="meta">Operations allowed</dt><dd style={{ margin: 0 }}>{r.tools.length ? r.tools.map((t) => <div key={t}><code>{t}</code> <span className="muted">{getOperation(t)?.title}</span></div>) : "None yet: plans and reviews only"}</dd></div>
                    <div><dt className="meta">Data access</dt><dd style={{ margin: 0 }}>{r.dataAccess.join("; ")}</dd></div>
                    <div><dt className="meta">Limits</dt><dd style={{ margin: 0 }}>${r.monthlyBudgetUsd}/month, {r.maxRunsPerDay} runs/day</dd></div>
                    <div><dt className="meta">Escalation</dt><dd style={{ margin: 0 }}>{r.escalation}</dd></div>
                    <div><dt className="meta">Success looks like</dt><dd style={{ margin: 0 }}>{r.successCriteria}</dd></div>
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Scorecard" sub={d.successMeasure}>
            <dl className="stack" style={{ margin: 0 }}>
              <div className="inline" style={{ justifyContent: "space-between" }}><dt className="muted">Tasks owned</dt><dd style={{ margin: 0 }}>{owned.length}</dd></div>
              <div className="inline" style={{ justifyContent: "space-between" }}><dt className="muted">Completed and reviewed</dt><dd style={{ margin: 0 }}>{done}</dd></div>
              <div className="inline" style={{ justifyContent: "space-between" }}><dt className="muted">Failed or returned</dt><dd style={{ margin: 0 }}>{owned.filter((t) => t.status === "failed" || t.status === "returned").length}</dd></div>
              <div className="inline" style={{ justifyContent: "space-between" }}><dt className="muted">Reviews performed</dt><dd style={{ margin: 0 }}>{tasks.filter((t) => roles.some((r) => r.id === t.reviewerRoleId) && t.gates.some((g) => g.gate === "independent-review")).length}</dd></div>
            </dl>
          </Panel>
          <Panel title="Activity">
            {tasks.length === 0 ? <p className="muted">No tasks yet.</p> : (
              <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {tasks.slice(0, 12).map((t) => (
                  <li key={t.id} className="inline" style={{ justifyContent: "space-between" }}>
                    <Link href={`/admin/tasks/${t.id}`}>{t.title}</Link>
                    <span className="inline"><TaskPill status={t.status} /><span className="meta">{ago(t.updatedAt)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
