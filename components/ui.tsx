import type { ReactNode } from "react";
import { deleteRecord } from "@/lib/actions";
import { ago, fmtDateTime } from "@/lib/format";
import type { Provenance, TaskStatus } from "@/lib/types";

export function PageHead({ title, intro, children }: { title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="adm-top">
      <div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {children && <div className="inline">{children}</div>}
    </div>
  );
}

export function Panel({ title, sub, action, children, id }: { title?: string; sub?: ReactNode; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="panel" id={id} aria-label={title}>
      {(title || action) && (
        <div className="panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <p>{sub}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

type Tone = "ok" | "warn" | "bad" | "info" | "plain" | "";
export function Pill({ tone = "", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

const TASK_TONE: Record<TaskStatus, Tone> = {
  planned: "",
  running: "info",
  "in-review": "info",
  "awaiting-approval": "warn",
  done: "ok",
  returned: "warn",
  failed: "bad",
  cancelled: "plain",
};
export function TaskPill({ status }: { status: TaskStatus }) {
  return <Pill tone={TASK_TONE[status]}>{status.replace("-", " ")}</Pill>;
}

export function Stats({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="stats">
      {items.map((i) => (
        <div className="stat" key={i.label}>
          <b>{i.value}</b>
          <span>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DeleteButton({ collection, id, label = "Delete" }: { collection: string; id: string; label?: string }) {
  return (
    <form action={deleteRecord}>
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="id" value={id} />
      <button className="btn danger small" type="submit">{label}</button>
    </form>
  );
}

export function VerificationPill({ v }: { v: Provenance["verification"] }) {
  return <Pill tone={v === "verified" ? "ok" : v === "estimated" ? "info" : "warn"}>{v}</Pill>;
}

export function ProvenanceLine({ p, tz }: { p: Provenance; tz: string }) {
  return (
    <span className="meta">
      <VerificationPill v={p.verification} />{" "}
      {p.sourceUrl ? <a href={p.sourceUrl}>source</a> : "no source"}, retrieved {fmtDateTime(p.retrievedAt, tz)} ({ago(p.retrievedAt)})
    </span>
  );
}

export function ReadOnlyNotice({ writable }: { writable: boolean }) {
  if (writable) return null;
  return <p className="notice">This deployment is read-only. Changes need the database connection (phase 2).</p>;
}
