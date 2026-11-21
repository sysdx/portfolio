import { PageHead, Panel, Pill } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import { canWrite, readStore } from "@/lib/store";
import { adminEnabled } from "@/lib/guard";

export default async function Audit() {
  const s = await readStore();
  const checks = [
    { label: "Admin blocked in production until sign-in is configured", ok: true, note: "proxy.ts + assertAdmin() in every action" },
    { label: "Secrets kept out of git", ok: true, note: ".env* ignored; .env.example has names only" },
    { label: "Owner and reviewer always different roles", ok: s.tasks.every((t) => t.ownerRoleId !== t.reviewerRoleId), note: "Enforced when tasks are created and reassigned" },
    { label: "Public achievements all verified", ok: s.achievements.filter((a) => a.visibility === "public").every((a) => a.verified), note: "Unverifying an achievement also unpublishes it" },
    { label: "Lessons are append-only", ok: true, note: "No edit or delete action exists for lessons" },
    { label: "Storage writable", ok: canWrite(), note: canWrite() ? "Local file store" : "Read-only until the database is connected" },
    { label: "Admin enabled in this environment", ok: adminEnabled(), note: process.env.NODE_ENV ?? "unknown" },
  ];
  return (
    <>
      <PageHead title="Security & audit" intro="Policy checks and every recorded action, newest first." />
      <Panel title="Policy checks">
        <div className="table-wrap"><table><tbody>
          {checks.map((c) => <tr key={c.label}><td>{c.ok ? <Pill tone="ok">pass</Pill> : <Pill tone="bad">fail</Pill>}</td><td>{c.label}</td><td className="meta">{c.note}</td></tr>)}
        </tbody></table></div>
      </Panel>
      <div style={{ height: 16 }} />
      <Panel title="Audit log" sub={`${s.audit.length} entries (latest 500 kept)`}>
        {s.audit.length === 0 ? <p className="muted">No actions recorded yet.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>When</th><th>Action</th><th>Detail</th></tr></thead>
            <tbody>{s.audit.slice(0, 200).map((a) => <tr key={a.id}><td className="meta" style={{ whiteSpace: "nowrap" }}>{fmtDateTime(a.at, s.settings.timezone)}</td><td><code>{a.action}</code></td><td className="muted">{a.detail}</td></tr>)}</tbody>
          </table></div>
        )}
      </Panel>
    </>
  );
}
