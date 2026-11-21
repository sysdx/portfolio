import Link from "next/link";
import { DeleteButton, Empty, PageHead, Panel, Pill } from "@/components/ui";
import { addContent, requestPublish, unpublish } from "@/lib/actions";
import { fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function Content() {
  const s = await readStore();
  const tz = s.settings.timezone;
  return (
    <>
      <PageHead title="Content studio" intro="Blog posts and LinkedIn drafts. Nothing is published or posted without your approval, and LinkedIn posts are never sent automatically: approved ones are marked scheduled for you to post." />
      <div className="grid side">
        <Panel title="Drafts and posts">
          {s.content.length === 0 ? <Empty title="No drafts">Write one, then request approval to publish it.</Empty> : (
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 14 }}>
              {s.content.map((c) => (
                <li key={c.id} className="panel" style={{ padding: 14 }}>
                  <div className="inline" style={{ justifyContent: "space-between" }}>
                    <strong>{c.status === "published" && c.channel === "blog" ? <Link href={`/writing/${c.id}`}>{c.title}</Link> : c.title}</strong>
                    <span className="inline"><Pill>{c.channel}</Pill><Pill tone={c.status === "published" ? "ok" : c.status === "awaiting-approval" ? "warn" : c.status === "scheduled" ? "info" : ""}>{c.status.replace("-", " ")}</Pill></span>
                  </div>
                  <p className="muted" style={{ fontSize: "var(--t-sm)", margin: "8px 0", whiteSpace: "pre-wrap" }}>{c.body.slice(0, 280)}{c.body.length > 280 ? "…" : ""}</p>
                  <p className="meta">Created {fmtDateTime(c.createdAt, tz)}{c.scheduledFor ? `, planned for ${c.scheduledFor}` : ""}</p>
                  <div className="inline" style={{ marginTop: 10 }}>
                    {c.status === "draft" && <form action={requestPublish}><input type="hidden" name="type" value="content" /><input type="hidden" name="id" value={c.id} /><button className="btn small" type="submit">Request approval</button></form>}
                    {(c.status === "published" || c.status === "scheduled") && <form action={unpublish}><input type="hidden" name="type" value="content" /><input type="hidden" name="id" value={c.id} /><button className="btn quiet small" type="submit">Back to draft</button></form>}
                    <DeleteButton collection="content" id={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="New draft" sub="Use only facts you can back up. Claims about results should point to the vault.">
          <form action={addContent} className="form">
            <div className="row">
              <label>Channel<select name="channel"><option value="blog">Blog (this site)</option><option value="linkedin">LinkedIn</option></select></label>
              <label>Planned date<input type="date" name="scheduledFor" /></label>
            </div>
            <label>Title<input type="text" name="title" required /></label>
            <label>Body<textarea name="body" rows={10} /></label>
            <div className="actions"><button className="btn" type="submit">Save draft</button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}
