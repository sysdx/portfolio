import Link from "next/link";
import { PageHead, Panel, Pill } from "@/components/ui";
import { readStore } from "@/lib/store";

export default async function Campaigns() {
  const s = await readStore();
  return (
    <>
      <PageHead title="Campaigns" intro="Long-term goals with milestones and evidence. Official status comes only from a verified source; your own estimates are kept separate." />
      <div className="grid three">
        {s.campaigns.map((c) => {
          const md = c.milestones.filter((m) => m.done).length;
          const events = s.events.filter((e) => e.campaignId === c.id && Date.parse(e.start) > Date.now()).length;
          return (
            <Panel key={c.id} title={c.title} sub={c.target} action={<Link href={`/admin/campaigns/${c.id}`}>Open</Link>}>
              <div className="stack">
                <div className="inline">
                  {c.officialStatus ? <Pill tone="ok">official: {c.officialStatus}</Pill> : <Pill>status not verified</Pill>}
                  {!c.requirementsCheckedAt && c.requirementsUrl && <Pill tone="warn">requirements unchecked</Pill>}
                </div>
                <div className="bar" aria-label={`${md} of ${c.milestones.length} milestones done`}><i style={{ width: c.milestones.length ? `${(md / c.milestones.length) * 100}%` : "0%" }} /></div>
                <p className="meta">{md}/{c.milestones.length} milestones, {events} upcoming events</p>
                <p style={{ fontSize: "var(--t-sm)" }}><span className="meta">Next: </span>{c.nextAction || "—"}</p>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
