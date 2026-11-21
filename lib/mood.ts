// Nyx's mood comes only from real records. It never shows success when something failed.
import type { Store } from "./types";

export type Mood = "sleeping" | "idle" | "curious" | "happy" | "concerned" | "celebrating";

export function computeMood(s: Store, now = Date.now()): { mood: Mood; say: string } {
  const recent = (iso: string | undefined, mins: number) => !!iso && now - Date.parse(iso) < mins * 60000;
  const running = s.tasks.filter((t) => t.status === "running");
  const failed = s.tasks.filter((t) => (t.status === "failed" || t.status === "returned") && recent(t.updatedAt, 24 * 60));
  const waiting = s.tasks.filter((t) => t.status === "awaiting-approval").length + s.approvals.filter((a) => a.status === "pending").length;
  // Priority: problems first, then work in progress, then good news.
  if (failed.length) return { mood: "concerned", say: `${failed.length} task${failed.length > 1 ? "s" : ""} failed or came back in the last day.` };
  if (waiting) return { mood: "concerned", say: `${waiting} item${waiting > 1 ? "s" : ""} waiting for your review.` };
  if (running.length) return { mood: "curious", say: `Working on: ${running[0].title}` };
  const published = s.audit.find((a) => a.action === "approval.approved" && /achievement/i.test(a.detail) && recent(a.at, 60));
  if (published) return { mood: "celebrating", say: "A verified achievement just went public." };
  const done = s.tasks.find((t) => t.status === "done" && recent(t.updatedAt, 15));
  if (done) return { mood: "happy", say: `Done and reviewed: ${done.title}` };
  const lastActivity = s.tasks[0]?.updatedAt;
  if (!lastActivity || !recent(lastActivity, 6 * 60)) return { mood: "sleeping", say: "Nothing running. Give me a command." };
  return { mood: "idle", say: "All quiet. Nothing needs you." };
}
