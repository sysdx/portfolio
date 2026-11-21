// End-to-end tests of the task workflow, run against a recorded copy of the real
// Codeforces contest.list response (tests/fixtures). Each test uses a fresh data folder.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";

const fixture = JSON.parse(readFileSync(path.join(__dirname, "fixtures/codeforces-contest-list.json"), "utf8"));
let mode: "ok" | "fail" | "moved" = "ok";
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  if (!url.includes("codeforces.com/api/contest.list")) return realFetch(input);
  if (mode === "fail") throw new Error("getaddrinfo ENOTFOUND codeforces.com");
  const body = structuredClone(fixture);
  if (mode === "moved") body.result[2].startTimeSeconds += 3600; // Round 1137 moved an hour later
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

import { computeMood } from "../lib/mood";
import { readStore, updateStore } from "../lib/store";
import { approveTask, createTask, planCommand, reassignTask, runTask } from "../lib/workflow";
import { OPERATIONS } from "../lib/operations";
import { ROLES, getRole } from "../lib/org";
import { replay } from "../lib/market";
import { zonedToIso } from "../lib/format";

let n = 0;
const key = () => `test-key-${++n}`;

beforeEach(() => {
  process.chdir(mkdtempSync(path.join(tmpdir(), "repos-")));
  mode = "ok";
});

describe("organization registry", () => {
  it("has unique role ids and valid managers", () => {
    const ids = new Set(ROLES.map((r) => r.id));
    assert.equal(ids.size, ROLES.length);
    for (const r of ROLES) if (r.managerId) assert.ok(ids.has(r.managerId), `${r.id} → ${r.managerId}`);
  });
  it("every operation's owner holds it and its reviewer is a different role", () => {
    for (const op of OPERATIONS) {
      assert.ok(getRole(op.ownerRoleId)?.tools.includes(op.id), op.id);
      assert.ok(getRole(op.reviewerRoleId), op.id);
      assert.notEqual(op.ownerRoleId, op.reviewerRoleId);
    }
  });
});

describe("acceptance slice: import Codeforces contests", () => {
  it("plans, runs, reviews and records verified events with provenance", async () => {
    assert.equal(planCommand("Import upcoming contests").operation, "codeforces.contests");
    const { task } = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard" });
    assert.equal(task.ownerRoleId, "intel.source-acquisition");
    assert.equal(task.reviewerRoleId, "intel.data-reliability");
    assert.equal(task.needsApproval, false);

    const done = await runTask(task.id);
    assert.equal(done.status, "done", done.log.join("\n"));
    const gates = done.gates.map((g) => `${g.gate}:${g.passed}`);
    assert.deepEqual(gates, ["requirements:true", "implementation:true", "automated-tests:true", "independent-review:true", "policy:true", "verification:true"]);
    assert.equal(done.gates.find((g) => g.gate === "independent-review")!.by, "intel.data-reliability");

    const s = await readStore();
    assert.equal(s.events.length, 5, "only the 5 BEFORE contests");
    for (const e of s.events) {
      assert.equal(e.verification, "verified");
      assert.match(e.sourceUrl, /^https:\/\/codeforces\.com\/api\/contest\.list/);
      assert.ok(e.retrievedAt);
      assert.equal(e.campaignId, "cmp.codeforces");
    }
    const r1137 = s.events.find((e) => e.externalId === "codeforces:2289")!;
    assert.equal(r1137.start, new Date(1795338300 * 1000).toISOString());
    assert.equal(r1137.end, new Date((1795338300 + 7200) * 1000).toISOString());
    assert.equal(s.sources.find((x) => x.id === "src.codeforces-api")!.health, "ok");
    assert.equal(computeMood(s).mood, "happy");
  });

  it("is idempotent: the same key never creates a second task", async () => {
    const k = key();
    const a = await createTask({ command: "Import upcoming contests", idempotencyKey: k, source: "dashboard" });
    const b = await createTask({ command: "Import upcoming contests", idempotencyKey: k, source: "claude-desktop" });
    assert.equal(b.duplicate, true);
    assert.equal(b.task.id, a.task.id);
    assert.equal((await readStore()).tasks.length, 1);
  });

  it("re-import doesn't duplicate events, and a moved date keeps its history", async () => {
    const t1 = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard" });
    await runTask(t1.task.id);
    mode = "moved";
    const t2 = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard" });
    await runTask(t2.task.id);
    const s = await readStore();
    assert.equal(s.events.length, 5);
    const e = s.events.find((x) => x.externalId === "codeforces:2289")!;
    assert.equal(e.history.length, 2, "start and end both moved");
    assert.equal(e.history[0].from, new Date(1795338300 * 1000).toISOString());
    assert.equal(e.start, new Date((1795338300 + 3600) * 1000).toISOString());
    assert.ok(s.audit.some((a) => a.action === "intel.change-detected"));
  });

  it("a network failure fails the task, marks the source unhealthy and Nyx is concerned", async () => {
    mode = "fail";
    const { task } = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard" });
    const t = await runTask(task.id);
    assert.equal(t.status, "failed");
    assert.equal(t.gates.at(-1)!.gate, "implementation");
    assert.equal(t.gates.at(-1)!.passed, false);
    const s = await readStore();
    assert.equal(s.events.length, 0, "nothing written on failure");
    const src = s.sources.find((x) => x.id === "src.codeforces-api")!;
    assert.equal(src.health, "error");
    assert.match(src.lastError, /ENOTFOUND/);
    assert.equal(computeMood(s).mood, "concerned", "never celebrates a failure");
    mode = "ok";
    const retried = await runTask(task.id, "founder");
    assert.equal(retried.status, "done");
    assert.equal(retried.attempts, 2);
  });
});

describe("autonomy and permissions", () => {
  it("level 0 blocks execution", async () => {
    await updateStore((s) => { s.settings.autonomyLevel = 0; });
    const { task } = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard" });
    const t = await runTask(task.id, "founder");
    assert.notEqual(t.status, "done");
    assert.ok(t.log.some((l) => /Observe/.test(l)));
  });
  it("level 1 waits for approval, then runs once approved", async () => {
    await updateStore((s) => { s.settings.autonomyLevel = 1; });
    const { task } = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard" });
    assert.equal(task.needsApproval, true);
    const held = await runTask(task.id);
    assert.equal(held.status, "awaiting-approval");
    const ran = await approveTask(task.id);
    assert.equal(ran.status, "done");
    assert.ok(ran.gates.some((g) => g.gate === "human-approval" && g.by === "founder"));
  });
  it("a role without the operation can't run it", async () => {
    const { task } = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard", ownerRoleId: "brand.social" });
    const t = await runTask(task.id);
    assert.notEqual(t.status, "done");
    assert.ok(t.log.some((l) => /not permitted/.test(l)));
  });
  it("owner and reviewer are never the same role", async () => {
    const { task } = await createTask({ command: "Import upcoming contests", idempotencyKey: key(), source: "dashboard", ownerRoleId: "security.qa", reviewerRoleId: "security.qa" });
    assert.notEqual(task.ownerRoleId, task.reviewerRoleId);
    await assert.rejects(reassignTask(task.id, task.reviewerRoleId), /reviewer/);
  });
  it("unrecognized commands become manual tasks for the Program Manager", async () => {
    const { task } = await createTask({ command: "Write a case study for the AIMO notebook", idempotencyKey: key(), source: "dashboard" });
    assert.equal(task.operation, null);
    assert.equal(task.ownerRoleId, "exec.program-manager");
  });
});

describe("integrity checks", () => {
  it("claims audit flags public items without verification or evidence", async () => {
    await updateStore((s) => {
      s.achievements.push({ id: "a1", title: "Unproven", issuer: "x", date: "2026-01-01", category: "other", evidenceUrl: "", notes: "", verified: false, visibility: "public", createdAt: "" });
    });
    const { task } = await createTask({ command: "Audit my public claims", idempotencyKey: key(), source: "dashboard" });
    const t = await runTask(task.id);
    assert.equal(t.status, "done");
    assert.equal(t.evidence.find((e) => e.label === "Problems found")!.value, "2");
  });
  it("freshness check flags unchecked campaign requirements and stale sources", async () => {
    const { task } = await createTask({ command: "Check data freshness", idempotencyKey: key(), source: "dashboard" });
    const t = await runTask(task.id);
    assert.equal(t.status, "done");
    assert.ok(Number(t.evidence.find((e) => e.label === "Flags")!.value) > 0);
  });
  it("concurrent writes are serialized, none lost", async () => {
    await Promise.all(Array.from({ length: 25 }, (_, i) => updateStore((s) => { s.audit.push({ id: `c${i}`, at: "", action: "t", detail: "" }); })));
    assert.equal((await readStore()).audit.length, 25);
  });
});

describe("helpers", () => {
  it("simulated portfolio replays trades into cash and positions", () => {
    const r = replay(1000, [
      { id: "1", at: "2026-01-01", asset: "bitcoin", side: "buy", qty: 0.01, priceUsd: 50000, priceSource: "t", priceFetchedAt: "" },
      { id: "2", at: "2026-01-02", asset: "bitcoin", side: "sell", qty: 0.004, priceUsd: 60000, priceSource: "t", priceFetchedAt: "" },
    ]);
    assert.ok(Math.abs(r.cash - (1000 - 500 + 240)) < 1e-9);
    assert.ok(Math.abs(r.positions[0].qty - 0.006) < 1e-12);
    assert.ok(Math.abs(r.positions[0].costUsd - 300) < 1e-9);
  });
  it("converts local times in a zone to UTC, across daylight saving", () => {
    assert.equal(zonedToIso("2026-12-01T17:00", "America/New_York"), "2026-12-01T22:00:00.000Z");
    assert.equal(zonedToIso("2026-07-01T17:00", "America/New_York"), "2026-07-01T21:00:00.000Z");
    assert.equal(zonedToIso("2026-07-01", "UTC"), "2026-07-01T00:00:00.000Z");
  });
});

describe("date display", () => {
  it("shows bare calendar dates as written, whatever the time zone", async () => {
    const { fmtDate } = await import("../lib/format");
    assert.equal(fmtDate("2026-09-08", "America/New_York"), "Sep 8, 2026");
    assert.equal(fmtDate("2026-09-08T02:00:00Z", "America/New_York"), "Sep 7, 2026");
  });
});
