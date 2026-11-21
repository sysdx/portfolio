import Link from "next/link";
import { CommandBar } from "@/components/CommandBar";
import { Empty, PageHead, Panel, TaskPill } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { getRole } from "@/lib/org";
import { readStore } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";

const FILTERS: Array<TaskStatus | "all"> = ["all", "awaiting-approval", "running", "returned", "failed", "done", "planned", "cancelled"];

export default async function Tasks({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const s = await readStore();
  const list = status === "all" ? s.tasks : s.tasks.filter((t) => t.status === status);
  return (
    <>
      <PageHead title="Task ledger" intro="One record per task: owner, reviewer, gates, evidence and log. Tasks from Claude Desktop will land here too." />
      <Panel title="New task"><CommandBar /></Panel>
      <div style={{ height: 16 }} />
      <Panel
        title={`${list.length} task${list.length === 1 ? "" : "s"}`}
        action={
          <nav className="tabs" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <Link key={f} href={f === "all" ? "/admin/tasks" : `/admin/tasks?status=${f}`} aria-current={status === f ? "true" : undefined}>{f.replace("-", " ")}</Link>
            ))}
          </nav>
        }
      >
        {list.length === 0 ? (
          <Empty title="No tasks here" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Source</th><th>Owner</th><th>Reviewer</th><th>Risk</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td><Link href={`/admin/tasks/${t.id}`}>{t.title}</Link></td>
                    <td className="meta">{t.source}</td>
                    <td className="muted">{getRole(t.ownerRoleId)?.title}</td>
                    <td className="muted">{getRole(t.reviewerRoleId)?.title}</td>
                    <td className="meta">{t.risk}</td>
                    <td><TaskPill status={t.status} /></td>
                    <td className="meta">{fmtDateTime(t.createdAt, s.settings.timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
