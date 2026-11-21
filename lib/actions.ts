"use server";
// Every control in the admin calls one of these. Each checks admin access,
// writes through the store, records an audit entry and refreshes the pages.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "./guard";
import { canWrite, newId, nowIso, updateStore } from "./store";
import type { Achievement, ContentDraft, ContestLog, Experiment, Hackathon, Opportunity, ResearchItem, Store, AutonomyLevel } from "./types";
import { approveTask, createTask, reassignTask, runTask, setTaskStatus } from "./workflow";

function str(fd: FormData, key: string, max = 2000): string {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

function audit(s: Store, action: string, detail: string) {
  s.audit.unshift({ id: newId("aud"), at: nowIso(), action, detail });
  s.audit = s.audit.slice(0, 500);
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- Tasks / organization ----------

export async function submitCommand(fd: FormData) {
  assertAdmin();
  const command = str(fd, "command", 500);
  const key = str(fd, "idempotencyKey", 100) || newId("idem");
  if (!command) return;
  const { task, duplicate } = await createTask({
    command,
    idempotencyKey: key,
    source: "dashboard",
    ownerRoleId: str(fd, "ownerRoleId") || undefined,
  });
  if (!duplicate && task.operation && !task.needsApproval) await runTask(task.id);
  refresh();
  redirect(`/admin/tasks/${task.id}`);
}

export async function runTaskAction(fd: FormData) {
  assertAdmin();
  await runTask(str(fd, "id"), "founder");
  refresh();
}

export async function approveTaskAction(fd: FormData) {
  assertAdmin();
  await approveTask(str(fd, "id"));
  refresh();
}

export async function cancelTaskAction(fd: FormData) {
  assertAdmin();
  await setTaskStatus(str(fd, "id"), "cancelled", str(fd, "note", 300));
  refresh();
}

export async function markTaskDoneAction(fd: FormData) {
  assertAdmin();
  await setTaskStatus(str(fd, "id"), "done", str(fd, "note", 300));
  refresh();
}

export async function reassignTaskAction(fd: FormData) {
  assertAdmin();
  await reassignTask(str(fd, "id"), str(fd, "ownerRoleId"));
  refresh();
}

// ---------- Achievements ----------

export async function addAchievement(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const a: Achievement = {
      id: newId("ach"),
      title: str(fd, "title", 200),
      issuer: str(fd, "issuer", 200),
      date: str(fd, "date", 10),
      category: (str(fd, "category") || "other") as Achievement["category"],
      evidenceUrl: str(fd, "evidenceUrl", 500),
      notes: str(fd, "notes"),
      verified: false,
      visibility: "private",
      createdAt: nowIso(),
    };
    if (!a.title) throw new Error("Give the achievement a title.");
    s.achievements.unshift(a);
    audit(s, "achievement.added", a.title);
  });
  refresh();
}

export async function verifyAchievement(fd: FormData) {
  assertAdmin();
  const id = str(fd, "id");
  await updateStore((s) => {
    const a = s.achievements.find((x) => x.id === id);
    if (!a) return;
    if (!/^https?:\/\//.test(a.evidenceUrl)) throw new Error("Add an evidence link before verifying.");
    a.verified = !a.verified;
    if (!a.verified) a.visibility = "private";
    audit(s, a.verified ? "achievement.verified" : "achievement.unverified", a.title);
  });
  refresh();
}

export async function requestPublish(fd: FormData) {
  assertAdmin();
  const type = str(fd, "type") as "achievement" | "content" | "research";
  const id = str(fd, "id");
  await updateStore((s) => {
    const item =
      type === "achievement" ? s.achievements.find((x) => x.id === id) : type === "research" ? s.research.find((x) => x.id === id) : s.content.find((x) => x.id === id);
    if (!item) return;
    if (type === "achievement" && !(item as Achievement).verified) throw new Error("Only verified achievements can be published.");
    if (s.approvals.some((x) => x.ref?.id === id && x.status === "pending")) return; // idempotent
    s.approvals.unshift({
      id: newId("apr"),
      kind: "publication",
      title: `Publish ${type}: ${item.title}`,
      detail: type === "content" ? (item as ContentDraft).body.slice(0, 400) : "Will appear on the public portfolio.",
      module: type === "achievement" ? "vault" : type === "research" ? "research" : "content",
      costUsd: 0,
      ref: { type, id },
      status: "pending",
      createdAt: nowIso(),
    });
    if (type === "content") (item as ContentDraft).status = "awaiting-approval";
    audit(s, "publish.requested", `${type} ${item.title}`);
  });
  refresh();
}

export async function unpublish(fd: FormData) {
  assertAdmin();
  const type = str(fd, "type");
  const id = str(fd, "id");
  await updateStore((s) => {
    if (type === "achievement") {
      const a = s.achievements.find((x) => x.id === id);
      if (a) a.visibility = "private";
    } else if (type === "research") {
      const r = s.research.find((x) => x.id === id);
      if (r) r.visibility = "private";
    } else {
      const c = s.content.find((x) => x.id === id);
      if (c) c.status = "draft";
    }
    audit(s, "unpublished", `${type} ${id}`);
  });
  refresh();
}

export async function decideApproval(fd: FormData) {
  assertAdmin();
  const id = str(fd, "id");
  const decision = str(fd, "decision") === "approve" ? "approved" : "rejected";
  await updateStore((s) => {
    const a = s.approvals.find((x) => x.id === id);
    if (!a || a.status !== "pending") return;
    a.status = decision;
    a.decidedAt = nowIso();
    if (a.ref) {
      if (a.ref.type === "achievement") {
        const ach = s.achievements.find((x) => x.id === a.ref!.id);
        if (ach && decision === "approved") {
          if (!ach.verified) throw new Error("This achievement is no longer verified.");
          ach.visibility = "public";
        }
      } else if (a.ref.type === "research") {
        const r = s.research.find((x) => x.id === a.ref!.id);
        if (r && decision === "approved") r.visibility = "public";
      } else {
        const c = s.content.find((x) => x.id === a.ref!.id);
        if (c) {
          if (decision === "approved") {
            const future = c.scheduledFor && new Date(c.scheduledFor) > new Date();
            c.status = c.channel === "blog" && !future ? "published" : "scheduled";
            if (c.status === "published") c.publishedAt = nowIso();
          } else c.status = "draft";
        }
      }
    }
    audit(s, `approval.${decision}`, a.title);
  });
  refresh();
}

// ---------- Generic records ----------

type Collection = "opportunities" | "experiments" | "hackathons" | "contests" | "research" | "content" | "achievements" | "messages" | "events" | "problems" | "bountyReports";

export async function deleteRecord(fd: FormData) {
  assertAdmin();
  const collection = str(fd, "collection") as Collection;
  const id = str(fd, "id");
  const allowed: Collection[] = ["opportunities", "experiments", "hackathons", "contests", "research", "content", "achievements", "messages", "events", "problems", "bountyReports"];
  if (!allowed.includes(collection)) throw new Error("Unknown collection.");
  await updateStore((s) => {
    const list = s[collection] as Array<{ id: string }>;
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) list.splice(idx, 1);
    s.approvals = s.approvals.filter((a) => !(a.ref?.id === id && a.status === "pending"));
    audit(s, "record.deleted", `${collection} ${id}`);
  });
  refresh();
}

export async function setOpportunityStatus(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const o = s.opportunities.find((x) => x.id === str(fd, "id"));
    if (!o) return;
    const next = str(fd, "status") as Opportunity["status"];
    if (next === "entered" && (!o.eligibility || !o.aiPolicy)) throw new Error("Record eligibility and the AI-use policy before entering.");
    o.status = next;
    audit(s, "opportunity.status", `${o.name} → ${next}`);
  });
  refresh();
}

export async function addExperiment(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const e: Experiment = {
      id: newId("exp"),
      competition: str(fd, "competition", 200),
      name: str(fd, "name", 200),
      approach: str(fd, "approach", 1000),
      cvScore: str(fd, "cvScore", 40),
      lbScore: str(fd, "lbScore", 40),
      notes: str(fd, "notes"),
      status: (str(fd, "status") || "planned") as Experiment["status"],
      createdAt: nowIso(),
    };
    if (!e.name) throw new Error("Name is required.");
    s.experiments.unshift(e);
    audit(s, "experiment.added", e.name);
  });
  refresh();
}

export async function addHackathon(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const h: Hackathon = {
      id: newId("hack"),
      name: str(fd, "name", 200),
      platform: str(fd, "platform", 100),
      url: str(fd, "url", 500),
      deadline: str(fd, "deadline", 10),
      stage: "idea",
      notes: str(fd, "notes"),
    };
    if (!h.name) throw new Error("Name is required.");
    s.hackathons.unshift(h);
    audit(s, "hackathon.added", h.name);
  });
  refresh();
}

export async function setHackathonStage(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const h = s.hackathons.find((x) => x.id === str(fd, "id"));
    if (!h) return;
    h.stage = str(fd, "stage") as Hackathon["stage"];
    audit(s, "hackathon.stage", `${h.name} → ${h.stage}`);
  });
  refresh();
}

export async function addContest(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const c: ContestLog = {
      id: newId("cl"),
      platform: (str(fd, "platform") || "Codeforces") as ContestLog["platform"],
      contest: str(fd, "contest", 200),
      date: str(fd, "date", 10),
      solved: str(fd, "solved", 100),
      upsolveNotes: str(fd, "upsolveNotes"),
    };
    if (!c.contest) throw new Error("Contest name is required.");
    s.contests.unshift(c);
    audit(s, "contest.logged", c.contest);
  });
  refresh();
}

export async function addResearch(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const r: ResearchItem = {
      id: newId("res"),
      title: str(fd, "title", 200),
      kind: (str(fd, "kind") || "report") as ResearchItem["kind"],
      status: (str(fd, "status") || "idea") as ResearchItem["status"],
      repoUrl: str(fd, "repoUrl", 500),
      summary: str(fd, "summary"),
      visibility: "private",
    };
    if (!r.title) throw new Error("Title is required.");
    s.research.unshift(r);
    audit(s, "research.added", r.title);
  });
  refresh();
}

export async function addContent(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const c: ContentDraft = {
      id: newId("cnt"),
      channel: (str(fd, "channel") || "blog") as ContentDraft["channel"],
      title: str(fd, "title", 200),
      body: str(fd, "body", 20000),
      status: "draft",
      scheduledFor: str(fd, "scheduledFor", 20),
      createdAt: nowIso(),
    };
    if (!c.title) throw new Error("Title is required.");
    s.content.unshift(c);
    audit(s, "content.drafted", c.title);
  });
  refresh();
}

export async function updateSettings(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    s.settings.githubUser = str(fd, "githubUser", 60);
    s.settings.codeforcesHandle = str(fd, "codeforcesHandle", 60);
    s.settings.atcoderHandle = str(fd, "atcoderHandle", 60);
    s.settings.kaggleUser = str(fd, "kaggleUser", 60);
    s.settings.monthlyBudgetUsd = Math.max(0, Number(str(fd, "monthlyBudgetUsd")) || 0);
    const level = Number(str(fd, "autonomyLevel"));
    s.settings.autonomyLevel = ([0, 1, 2, 3].includes(level) ? level : 2) as AutonomyLevel;
    const tz = str(fd, "timezone", 60);
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      s.settings.timezone = tz;
    } catch {
      /* keep the old timezone if the new one is invalid */
    }
    s.settings.requireApprovalForPublishing = true; // always on: public claims need your yes
    s.settings.requireApprovalForSubmissions = true;
    audit(s, "settings.updated", `autonomy ${s.settings.autonomyLevel}`);
  });
  refresh();
}

export async function markMessageRead(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const m = s.messages.find((x) => x.id === str(fd, "id"));
    if (m) m.read = true;
  });
  refresh();
}

// ---------- Public ----------

export type ContactState = { ok: boolean; message: string } | null;

export async function sendContactMessage(_prev: ContactState, fd: FormData): Promise<ContactState> {
  if (str(fd, "company")) return { ok: true, message: "Thanks — your message was sent." }; // honeypot
  const name = str(fd, "name", 120);
  const email = str(fd, "email", 200);
  const body = str(fd, "body", 4000);
  if (!name || !body) return { ok: false, message: "Add your name and a message." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter an email address I can reply to." };
  if (!canWrite()) return { ok: false, message: "The contact form isn't connected yet. Reach me on GitHub instead." };
  await updateStore((s) => {
    s.messages.unshift({ id: newId("msg"), name, email, body, createdAt: nowIso(), read: false });
  });
  return { ok: true, message: "Thanks — your message was sent." };
}
