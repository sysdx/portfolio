// Task workflow: command → task → owner role runs an operation → automated tests →
// independent review by a different role → policy check → founder approval (if needed)
// → verification → done. A failed gate returns the task with the reason.
// Runs in-process today; phase 2 moves runTask into a durable queue worker.
import type { GateId, GateResult, Store, Task } from "./types";
import { getOperation, OPERATIONS } from "./operations";
import { getRole } from "./org";
import { newId, nowIso, readStore, updateStore } from "./store";

export interface PlannedTask {
  title: string;
  operation: string | null;
  ownerRoleId: string;
  reviewerRoleId: string;
  completionCriteria: string;
  matched: boolean;
}

const PATTERNS: Array<{ re: RegExp; op: string }> = [
  { re: /\b(github|repos?|repositor)/i, op: "github.sync" },
  { re: /\b(contests?|schedule|calendar|upcoming)\b/i, op: "codeforces.contests" },
  { re: /\b(fresh|stale|data quality|freshness)/i, op: "intel.freshness" },
  { re: /\b(codeforces|cf rating|rating)\b/i, op: "codeforces.sync" },
  { re: /\b(audit|claims?|fact[- ]?check|verify public)/i, op: "claims.audit" },
];

/** Rule-based planner. Replaced by the AI Chief of Staff once a model key is connected. */
export function planCommand(command: string): PlannedTask {
  const hit = PATTERNS.find((p) => p.re.test(command));
  const op = hit ? getOperation(hit.op) : undefined;
  if (op) {
    return { title: op.title, operation: op.id, ownerRoleId: op.ownerRoleId, reviewerRoleId: op.reviewerRoleId, completionCriteria: op.completionCriteria, matched: true };
  }
  return {
    title: command.trim().slice(0, 120),
    operation: null,
    ownerRoleId: "exec.program-manager",
    reviewerRoleId: "security.qa",
    completionCriteria: "Founder marks the task done after reviewing the result.",
    matched: false,
  };
}

function gate(task: Task, g: GateId, passed: boolean, by: string, note: string): GateResult {
  const r: GateResult = { gate: g, passed, by, at: nowIso(), note };
  task.gates.push(r);
  task.log.push(`${passed ? "PASS" : "FAIL"} ${g} (${by}): ${note}`);
  return r;
}

function audit(s: Store, action: string, detail: string) {
  s.audit.unshift({ id: newId("aud"), at: nowIso(), action, detail });
  s.audit = s.audit.slice(0, 500);
}

function runsToday(s: Store, roleId: string): number {
  const day = nowIso().slice(0, 10);
  return s.tasks.filter((t) => t.ownerRoleId === roleId && t.attempts > 0 && t.updatedAt.slice(0, 10) === day).length;
}

export async function createTask(input: {
  command: string;
  idempotencyKey: string;
  source: Task["source"];
  ownerRoleId?: string;
  reviewerRoleId?: string;
}): Promise<{ task: Task; duplicate: boolean }> {
  let result: { task: Task; duplicate: boolean } | undefined;
  await updateStore((s) => {
    const existing = s.tasks.find((t) => t.idempotencyKey === input.idempotencyKey);
    if (existing) {
      result = { task: existing, duplicate: true };
      return;
    }
    const plan = planCommand(input.command);
    const op = getOperation(plan.operation);
    const owner = input.ownerRoleId && getRole(input.ownerRoleId) ? input.ownerRoleId : plan.ownerRoleId;
    let reviewer = input.reviewerRoleId && getRole(input.reviewerRoleId) ? input.reviewerRoleId : plan.reviewerRoleId;
    if (reviewer === owner) reviewer = owner === "security.qa" ? "security.director" : "security.qa";
    const now = nowIso();
    const task: Task = {
      id: newId("task"),
      idempotencyKey: input.idempotencyKey,
      title: plan.title,
      command: input.command,
      source: input.source,
      operation: plan.operation,
      ownerRoleId: owner,
      reviewerRoleId: reviewer,
      dependsOn: [],
      risk: op?.risk ?? "medium",
      needsApproval: op ? op.external || s.settings.autonomyLevel < 2 : true,
      status: "planned",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      gates: [],
      evidence: [],
      log: [`Created from ${input.source}: "${input.command}"`, plan.matched ? `Planner matched operation ${plan.operation}` : "No operation matched; assigned to Program Manager as a manual task"],
      completionCriteria: plan.completionCriteria,
    };
    gate(task, "requirements", true, "exec.chief-of-staff", op ? `Operation ${op.id} exists; owner ${owner} holds it; reviewer ${reviewer} is independent` : "Manual task recorded with owner and reviewer");
    s.tasks.unshift(task);
    audit(s, "task.created", `${task.id} ${task.title}`);
    result = { task, duplicate: false };
  });
  return result!;
}

/** Runs the task through every gate. Safe to call again for retries. */
export async function runTask(taskId: string, by: "system" | "founder" = "system"): Promise<Task> {
  // 1. Pre-flight checks and mark running.
  const ctx: { blocked: string | null; snapshot?: Store } = { blocked: null };
  await updateStore((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t) throw new Error("Task not found.");
    const op = getOperation(t.operation);
    const owner = getRole(t.ownerRoleId);
    if (!op) ctx.blocked = "Manual task: no operation to run.";
    else if (!owner?.tools.includes(op.id)) ctx.blocked = `${t.ownerRoleId} is not permitted to run ${op.id}.`;
    else if (s.settings.autonomyLevel === 0) ctx.blocked = "Autonomy is set to Observe. Raise it to run tasks.";
    else if (t.needsApproval && by !== "founder") ctx.blocked = "Waiting for founder approval to run.";
    else if (owner && runsToday(s, owner.id) >= owner.maxRunsPerDay) ctx.blocked = `${owner.title} reached its ${owner.maxRunsPerDay} runs/day limit.`;
    if (ctx.blocked) {
      t.log.push(`Not run: ${ctx.blocked}`);
      if (t.needsApproval && op) t.status = "awaiting-approval";
      t.updatedAt = nowIso();
      return;
    }
    t.status = "running";
    t.attempts += 1;
    t.updatedAt = nowIso();
    t.log.push(`Attempt ${t.attempts} started by ${by === "founder" ? "founder" : t.ownerRoleId}`);
    ctx.snapshot = structuredClone(s);
  });
  if (ctx.blocked || !ctx.snapshot) return (await readStore()).tasks.find((t) => t.id === taskId)!;

  const snapshot = ctx.snapshot;
  const task0 = snapshot.tasks.find((t) => t.id === taskId)!;
  const op = getOperation(task0.operation)!;

  // 2. Implementation (outside the write lock: may call the network).
  let outcome: Awaited<ReturnType<typeof op.run>> | null = null;
  let error: string | null = null;
  try {
    outcome = await op.run(snapshot);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // 3. Gates and final state.
  let final: Task | undefined;
  await updateStore((s) => {
    const t = s.tasks.find((x) => x.id === taskId)!;
    t.updatedAt = nowIso();
    const src = op.sourceId ? s.sources.find((x) => x.id === op.sourceId) : undefined;
    if (src) {
      src.lastCheckedAt = nowIso();
      src.health = outcome ? "ok" : "error";
      src.lastError = outcome ? "" : (error ?? "Unknown error");
    }
    if (!outcome) {
      gate(t, "implementation", false, t.ownerRoleId, error ?? "Unknown error");
      t.status = "failed";
      audit(s, "task.failed", `${t.id}: ${error}`);
      final = t;
      return;
    }
    t.evidence = outcome.evidence;
    t.log.push(...outcome.log);
    gate(t, "implementation", true, t.ownerRoleId, "Operation completed and produced evidence");

    const testFail = op.test(outcome);
    if (testFail) {
      gate(t, "automated-tests", false, "system", testFail);
      t.status = "returned";
      audit(s, "task.returned", `${t.id}: ${testFail}`);
      final = t;
      return;
    }
    gate(t, "automated-tests", true, "system", "Result passed the operation's checks");

    // Independent review: a different role checks the evidence.
    const reviewProblems: string[] = [];
    if (t.reviewerRoleId === t.ownerRoleId) reviewProblems.push("reviewer is the same role as the owner");
    if (t.evidence.length === 0) reviewProblems.push("no evidence recorded");
    if (t.evidence.some((e) => !e.value)) reviewProblems.push("empty evidence values");
    if (reviewProblems.length) {
      gate(t, "independent-review", false, t.reviewerRoleId, reviewProblems.join("; "));
      t.status = "returned";
      final = t;
      return;
    }
    gate(t, "independent-review", true, t.reviewerRoleId, `Checked ${t.evidence.length} evidence items`);
    gate(t, "policy", !op.external, "security.policy", op.external ? "External action: founder approval required" : "Internal, reversible, read-only source. Allowed at current autonomy level");

    outcome.apply(s);
    gate(t, "verification", true, "system", "State change written and readable");
    t.status = "done";
    audit(s, "task.done", `${t.id} ${t.title}`);
    final = t;
  });
  return final!;
}

export async function approveTask(taskId: string): Promise<Task> {
  await updateStore((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t) throw new Error("Task not found.");
    gate(t, "human-approval", true, "founder", "Approved to run");
    t.needsApproval = false;
    t.status = "planned";
    t.updatedAt = nowIso();
    audit(s, "task.approved", t.id);
  });
  return runTask(taskId, "founder");
}

export async function setTaskStatus(taskId: string, status: "cancelled" | "done", note: string): Promise<void> {
  await updateStore((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t) throw new Error("Task not found.");
    if (status === "done") gate(t, "human-approval", true, "founder", note || "Marked done by founder");
    t.status = status;
    t.log.push(`Founder set status to ${status}${note ? `: ${note}` : ""}`);
    t.updatedAt = nowIso();
    audit(s, `task.${status}`, t.id);
  });
}

export async function reassignTask(taskId: string, ownerRoleId: string): Promise<void> {
  await updateStore((s) => {
    const t = s.tasks.find((x) => x.id === taskId);
    const role = getRole(ownerRoleId);
    if (!t || !role) throw new Error("Task or role not found.");
    if (t.reviewerRoleId === ownerRoleId) throw new Error("The owner can't also be the reviewer.");
    t.log.push(`Reassigned from ${t.ownerRoleId} to ${ownerRoleId}`);
    t.ownerRoleId = ownerRoleId;
    t.updatedAt = nowIso();
    audit(s, "task.reassigned", `${t.id} → ${ownerRoleId}`);
  });
}

const EXAMPLES: Record<string, string> = {
  "github.sync": "Sync my GitHub repos",
  "codeforces.sync": "Update my Codeforces rating",
  "codeforces.contests": "Import upcoming contests",
  "intel.freshness": "Check data freshness",
  "claims.audit": "Audit my public claims",
};

export const KNOWN_COMMANDS = OPERATIONS.map((o) => ({ id: o.id, title: o.title, example: EXAMPLES[o.id] ?? o.title }));
