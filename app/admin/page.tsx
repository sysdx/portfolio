import Link from "next/link";
import { CommandBar } from "@/components/CommandBar";
import { Empty, PageHead, Panel, Pill, Stats, TaskPill, VerificationPill } from "@/components/ui";
import { ago, fmtDateTime } from "@/lib/format";
import { AUTONOMY_LEVELS, DEPARTMENTS, getRole, ROLES } from "@/lib/org";
import { canWrite, readStore } from "@/lib/store";

export default async function CommandCenter() {
  const s = await readStore();
  const tz = s.settings.timezone;
  const now = Date.now();
  const week = s.events
    .filter((e) => Date.parse(e.start) >= now - 3600000 && Date.parse(e.start) <= now + 7 * 86400000)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 8);
  const pending = s.approvals.filter((a) => a.status === "pending").length + s.tasks.filter((t) => t.status === "awaiting-approval").length;
  const done = s.tasks.filter((t) => t.status === "done").length;
  const failed = s.tasks.filter((t) => t.status === "failed" || t.status === "returned").length;
  const level = AUTONOMY_LEVELS[s.settings.autonomyLevel];
  const verifiedAch = s.achievements.filter((a) => a.verified).length;
  const deptActivity = DEPARTMENTS.map((d) => ({
    d,
    tasks: s.tasks.filter((t) => getRole(t.ownerRoleId)?.department === d.id).length,
  }));
  return (
    <>
      <PageHead title="Command center" intro="Everything on this page comes from your own records. Empty means nothing has happened yet, not that data is hidden.">
        <Pill tone="info">Autonomy level {level.level}: {level.name}</Pill>
      </PageHead>
      {!canWrite() && <p className="notice">Read-only deployment: commands need the database connection.</p>}

      <Panel title="Command" sub="Creates a task, assigns an owner and an independent reviewer, then runs it through the quality gates.">
        <CommandBar />
      </Panel>

      <div style={{ height: 16 }} />
      <Stats
        items={[
          { label: "Departments", value: DEPARTMENTS.length },
          { label: "Defined roles", value: ROLES.length },
          { label: "Tasks completed", value: done },
          { label: "Failed or returned", value: failed },
          { label: "Waiting for you", value: pending },
          { label: "Verified achievements", value: verifiedAch },
        ]}
      />

      <div className="grid side">
        <Panel title="Recent tasks" action={<Link href="/admin/tasks">Task ledger</Link>}>
          {s.tasks.length === 0 ? (
            <Empty title="No tasks yet">Try “Import upcoming contests” in the command box above.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Owner</th><th>Status</th><th>Updated</th></tr></thead>
                <tbody>
                  {s.tasks.slice(0, 8).map((t) => (
                    <tr key={t.id}>
                      <td><Link href={`/admin/tasks/${t.id}`}>{t.title}</Link></td>
                      <td className="muted">{getRole(t.ownerRoleId)?.title ?? t.ownerRoleId}</td>
                      <td><TaskPill status={t.status} /></td>
                      <td className="meta">{ago(t.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Next 7 days" action={<Link href="/admin/calendar">Calendar</Link>}>
          {week.length === 0 ? (
            <Empty title="Nothing scheduled">Import contests or add an opportunity with a deadline.</Empty>
          ) : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {week.map((e) => (
                <li key={e.id} className="stack" style={{ gap: 2 }}>
                  <span>{e.title}</span>
                  <span className="meta">{fmtDateTime(e.start, tz)} <VerificationPill v={e.verification} /></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div style={{ height: 16 }} />
      <div className="grid two">
        <Panel title="Campaigns" action={<Link href="/admin/campaigns">All campaigns</Link>}>
          <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {s.campaigns.map((c) => {
              const ms = c.milestones.length;
              const md = c.milestones.filter((m) => m.done).length;
              return (
                <li key={c.id} className="stack" style={{ gap: 4 }}>
                  <div className="inline" style={{ justifyContent: "space-between" }}>
                    <Link href={`/admin/campaigns/${c.id}`}>{c.title}</Link>
                    <span className="meta">{c.officialStatus ? `Official: ${c.officialStatus}` : "Status not verified"}</span>
                  </div>
                  <div className="bar" aria-label={`${md} of ${ms} milestones`}><i style={{ width: ms ? `${(md / ms) * 100}%` : "0%" }} /></div>
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Department activity" sub="Tasks owned by each department's roles." action={<Link href="/admin/org">Org chart</Link>}>
          <div className="table-wrap">
            <table>
              <tbody>
                {deptActivity.map(({ d, tasks }) => (
                  <tr key={d.id}>
                    <td><Link href={`/admin/org/${d.id}`}>{d.name}</Link></td>
                    <td className="num">{tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div style={{ height: 16 }} />
      <Panel title="System health" sub="Data sources and when each was last checked." action={<Link href="/admin/intel">Source registry</Link>}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Source</th><th>Access</th><th>Health</th><th>Last checked</th></tr></thead>
            <tbody>
              {s.sources.map((src) => (
                <tr key={src.id}>
                  <td>{src.name}</td>
                  <td className="muted">{src.access.replace("-", " ")}</td>
                  <td><Pill tone={src.health === "ok" ? "ok" : src.health === "error" ? "bad" : ""}>{src.health}</Pill></td>
                  <td className="meta">{ago(src.lastCheckedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
