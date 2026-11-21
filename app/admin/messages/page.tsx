import { DeleteButton, Empty, PageHead, Panel, Pill } from "@/components/ui";
import { markMessageRead } from "@/lib/actions";
import { fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function Messages() {
  const s = await readStore();
  return (
    <>
      <PageHead title="Messages" intro="Sent through the contact form on your public site." />
      <Panel>
        {s.messages.length === 0 ? <Empty title="No messages yet" /> : (
          <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 14 }}>
            {s.messages.map((m) => (
              <li key={m.id} className="panel" style={{ padding: 14 }}>
                <div className="inline" style={{ justifyContent: "space-between" }}>
                  <strong>{m.name} <span className="meta">{m.email}</span></strong>
                  <span className="inline">{!m.read && <Pill tone="info">new</Pill>}<span className="meta">{fmtDateTime(m.createdAt, s.settings.timezone)}</span></span>
                </div>
                <p style={{ margin: "8px 0", whiteSpace: "pre-wrap", fontSize: "var(--t-sm)" }}>{m.body}</p>
                <div className="inline">
                  <a className="btn small" href={`mailto:${m.email}`}>Reply by email</a>
                  {!m.read && <form action={markMessageRead}><input type="hidden" name="id" value={m.id} /><button className="btn quiet small" type="submit">Mark read</button></form>}
                  <DeleteButton collection="messages" id={m.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
