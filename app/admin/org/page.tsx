import Link from "next/link";
import { PageHead, Panel, Pill, Stats } from "@/components/ui";
import { AUTONOMY_LEVELS, DEPARTMENTS, getRole, ROLES, rolesIn, specialistCount } from "@/lib/org";
import { readStore } from "@/lib/store";

export default async function Org() {
  const s = await readStore();
  const leaders = ROLES.filter((r) => r.managerId === "exec.chief-of-staff");
  const fromSpec = ROLES.filter((r) => r.defined === "spec").length;
  return (
    <>
      <PageHead title="Organization" intro="Logical roles, invoked when a task needs them. None of them runs as a standing process, and none can approve its own work." />
      <Stats
        items={[
          { label: "Departments", value: DEPARTMENTS.length },
          { label: "Roles in total", value: ROLES.length },
          { label: "Specialist roles", value: specialistCount() },
          { label: "Named in your spec", value: fromSpec },
          { label: "Roles with live operations", value: ROLES.filter((r) => r.tools.length).length },
        ]}
      />
      <Panel title="Reporting lines">
        <div className="org-root">
          <div className="org-node you">You — founder and final approver</div>
          <div className="org-node">{getRole("exec.chief-of-staff")?.title}</div>
          <div className="inline" style={{ justifyContent: "center" }}>
            {leaders.map((r) => <span key={r.id} className="pill plain">{r.title}</span>)}
          </div>
        </div>
        <div className="org-depts">
          {DEPARTMENTS.map((d) => {
            const roles = rolesIn(d.id);
            const tasks = s.tasks.filter((t) => getRole(t.ownerRoleId)?.department === d.id);
            return (
              <Link key={d.id} href={`/admin/org/${d.id}`} className="org-dept">
                <h3>{d.name}</h3>
                <p>{d.deliverable}</p>
                <p className="meta">{roles.length} roles, {tasks.length} tasks{roles.some((r) => r.tools.length) ? ", has live operations" : ""}</p>
              </Link>
            );
          })}
        </div>
      </Panel>
      <div style={{ height: 16 }} />
      <Panel title="Autonomy levels" sub="Change the level in Settings. External actions always wait for you, at every level.">
        <div className="table-wrap">
          <table>
            <tbody>
              {AUTONOMY_LEVELS.map((l) => (
                <tr key={l.level}>
                  <td style={{ width: 40 }}>{l.level}</td>
                  <td style={{ width: 180 }}><strong>{l.name}</strong></td>
                  <td className="muted">{l.summary}</td>
                  <td>{s.settings.autonomyLevel === l.level && <Pill tone="info">current</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="meta" style={{ marginTop: 16 }}>Your 2.0 spec says 52 specialists, but its department counts add up to {specialistCount() - 7}. I built those, plus the 8 intelligence roles from 3.0 (a head and 7 specialists). Roles marked “proposed” were not named in your spec; rename or replace them in lib/org.ts.</p>
    </>
  );
}
