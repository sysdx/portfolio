"use server";
// Intelligence, calendar, campaigns, academy, bounty and market actions.
import { revalidatePath } from "next/cache";
import { assertAdmin } from "./guard";
import { zonedToIso } from "./format";
import { getLivePrice, MARKET_SOURCE, replay } from "./market";
import { newId, nowIso, updateStore } from "./store";
import type { BountyReport, CalendarEvent, Opportunity, Problem, Store, Verification } from "./types";

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
const isUrl = (u: string) => /^https?:\/\//.test(u);

// ---------- Opportunities: deadline-aware orchestration ----------

export async function addOpportunity(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const sourceUrl = str(fd, "sourceUrl", 500) || str(fd, "url", 500);
    const verification = (str(fd, "verification") || "unconfirmed") as Verification;
    if (verification === "verified" && !isUrl(sourceUrl)) throw new Error("A verified deadline needs the official source link.");
    const deadlineIso = zonedToIso(str(fd, "deadline", 16), s.settings.timezone);
    const o: Opportunity = {
      id: newId("opp"),
      kind: (str(fd, "kind") || "competition") as Opportunity["kind"],
      name: str(fd, "name", 200),
      platform: str(fd, "platform", 100),
      url: str(fd, "url", 500),
      deadline: deadlineIso,
      eligibility: str(fd, "eligibility", 500),
      aiPolicy: str(fd, "aiPolicy", 500),
      priority: (str(fd, "priority") || "medium") as Opportunity["priority"],
      status: "watching",
      campaignId: str(fd, "campaignId") || null,
      sourceId: null,
      sourceUrl,
      retrievedAt: nowIso(),
      verification,
    };
    if (!o.name) throw new Error("Name is required.");
    s.opportunities.unshift(o);
    if (deadlineIso) {
      const deadline = Date.parse(deadlineIso);
      const plan: Array<[string, number, CalendarEvent["kind"]]> = [
        [`Eligibility & rules review: ${o.name}`, 14, "approval"],
        [`Submission review: ${o.name}`, 2, "approval"],
      ];
      for (const [title, daysBefore, kind] of plan) {
        const at = deadline - daysBefore * 86400000;
        if (at > Date.now()) s.events.push(planningEvent(title, new Date(at).toISOString(), kind, o));
      }
      s.events.push({ ...planningEvent(`Deadline: ${o.name}`, deadlineIso, "deadline", o), verification, sourceUrl });
    }
    audit(s, "opportunity.added", `${o.name} (${verification})`);
  });
  refresh();
}

function planningEvent(title: string, start: string, kind: CalendarEvent["kind"], o: Opportunity): CalendarEvent {
  return {
    id: newId("evt"),
    externalId: null,
    title,
    kind,
    start,
    end: null,
    campaignId: o.campaignId,
    opportunityId: o.id,
    recurrence: "none",
    notes: "Planning step created automatically from the deadline.",
    history: [],
    sourceId: null,
    sourceUrl: "",
    retrievedAt: nowIso(),
    verification: "estimated",
  };
}

// ---------- Calendar ----------

export async function addEvent(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const sourceUrl = str(fd, "sourceUrl", 500);
    let verification = (str(fd, "verification") || "unconfirmed") as Verification;
    if (verification === "verified" && !isUrl(sourceUrl)) verification = "unconfirmed";
    const start = zonedToIso(str(fd, "start", 16), s.settings.timezone);
    if (!start) throw new Error("Pick a start time.");
    const endLocal = str(fd, "end", 16);
    const e: CalendarEvent = {
      id: newId("evt"),
      externalId: null,
      title: str(fd, "title", 200),
      kind: (str(fd, "kind") || "other") as CalendarEvent["kind"],
      start,
      end: endLocal ? zonedToIso(endLocal, s.settings.timezone) : null,
      campaignId: str(fd, "campaignId") || null,
      opportunityId: null,
      recurrence: str(fd, "recurrence") === "weekly" ? "weekly" : "none",
      notes: str(fd, "notes", 1000),
      history: [],
      sourceId: null,
      sourceUrl,
      retrievedAt: nowIso(),
      verification,
    };
    if (!e.title) throw new Error("Title is required.");
    s.events.push(e);
    audit(s, "event.added", `${e.title} (${verification})`);
  });
  refresh();
}

export async function moveEvent(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const e = s.events.find((x) => x.id === str(fd, "id"));
    if (!e) return;
    const start = zonedToIso(str(fd, "start", 16), s.settings.timezone);
    if (!start || start === e.start) return;
    e.history.push({ at: nowIso(), field: "start", from: e.start, to: start, by: "founder" });
    e.start = start;
    if (e.externalId) e.verification = "unconfirmed"; // a manual edit overrides the official source
    audit(s, "event.moved", e.title);
  });
  refresh();
}

// ---------- Campaigns ----------

export async function updateCampaign(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const c = s.campaigns.find((x) => x.id === str(fd, "id"));
    if (!c) return;
    const official = str(fd, "officialStatus", 300);
    const evidence = str(fd, "officialStatusEvidence", 500);
    if (official !== c.officialStatus || evidence !== c.officialStatusEvidence) {
      if (official && !isUrl(evidence)) throw new Error("Official status needs an evidence link (your profile page, for example).");
      c.officialStatus = official;
      c.officialStatusEvidence = evidence;
      c.officialStatusCheckedAt = official ? nowIso() : null;
    }
    c.internalEstimate = str(fd, "internalEstimate", 1000);
    c.nextAction = str(fd, "nextAction", 500);
    c.weeklyHours = Math.max(0, Number(str(fd, "weeklyHours")) || 0);
    c.skills = str(fd, "skills", 500).split(",").map((x) => x.trim()).filter(Boolean);
    if (str(fd, "requirementsChecked") === "on") c.requirementsCheckedAt = nowIso();
    audit(s, "campaign.updated", c.title);
  });
  refresh();
}

export async function addMilestone(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const c = s.campaigns.find((x) => x.id === str(fd, "campaignId"));
    const title = str(fd, "title", 200);
    if (!c || !title) return;
    c.milestones.push({ id: newId("ms"), title, done: false, evidenceUrl: "" });
  });
  refresh();
}

export async function completeMilestone(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const c = s.campaigns.find((x) => x.id === str(fd, "campaignId"));
    const m = c?.milestones.find((x) => x.id === str(fd, "id"));
    if (!c || !m) return;
    const evidence = str(fd, "evidenceUrl", 500);
    if (!m.done && !isUrl(evidence)) throw new Error("Add an evidence link to complete a milestone.");
    m.done = !m.done;
    m.evidenceUrl = m.done ? evidence : "";
    m.doneAt = m.done ? nowIso() : undefined;
    audit(s, m.done ? "milestone.done" : "milestone.reopened", `${c.title}: ${m.title}`);
  });
  refresh();
}

// ---------- Academy ----------

const INTERVALS = [1, 3, 7, 14, 30, 60];
function addDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export async function addProblem(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const ref = str(fd, "ref", 300);
    const platform = (str(fd, "platform") || "LeetCode") as Problem["platform"];
    if (!ref) throw new Error("Add the problem id or link.");
    if (s.problems.some((p) => p.platform === platform && p.ref.toLowerCase() === ref.toLowerCase())) {
      throw new Error("Already logged. Unique problems only count once.");
    }
    s.problems.unshift({
      id: newId("prb"),
      platform,
      ref,
      title: str(fd, "title", 200) || ref,
      difficulty: str(fd, "difficulty", 40),
      topics: str(fd, "topics", 300).split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      mode: str(fd, "mode") === "assisted" ? "assisted" : "independent",
      solvedAt: str(fd, "solvedAt", 10) || nowIso().slice(0, 10),
      reviewCount: 0,
      nextReview: addDays(INTERVALS[0]),
    });
  });
  refresh();
}

export async function reviewProblem(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const p = s.problems.find((x) => x.id === str(fd, "id"));
    if (!p) return;
    const recalled = str(fd, "result") === "recalled";
    p.reviewCount = recalled ? p.reviewCount + 1 : 0;
    p.nextReview = addDays(INTERVALS[Math.min(p.reviewCount, INTERVALS.length - 1)]);
  });
  refresh();
}

// ---------- Bug bounty ----------

export async function addBountyProgram(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const name = str(fd, "name", 200);
    if (!name) throw new Error("Name is required.");
    s.bountyPrograms.unshift({
      id: newId("bbp"),
      name,
      platform: str(fd, "platform", 100),
      url: str(fd, "url", 500),
      ageRequirement: str(fd, "ageRequirement", 300),
      inScope: str(fd, "inScope", 3000),
      outOfScope: str(fd, "outOfScope", 3000),
      rules: str(fd, "rules", 3000),
      authorizationConfirmed: false,
      status: "researching",
    });
    audit(s, "bounty.program-added", name);
  });
  refresh();
}

export async function confirmBountyAuthorization(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const p = s.bountyPrograms.find((x) => x.id === str(fd, "id"));
    if (!p) return;
    if (!p.authorizationConfirmed) {
      if (!isUrl(p.url) || !p.inScope || !p.ageRequirement) throw new Error("Record the program link, age requirement and in-scope targets first.");
      if (str(fd, "eligible") !== "on" || str(fd, "readRules") !== "on") throw new Error("Confirm both statements to authorize this program.");
      p.authorizationConfirmed = true;
      p.confirmedAt = nowIso();
      p.status = "authorized";
    } else {
      p.authorizationConfirmed = false;
      p.status = "paused";
    }
    audit(s, p.authorizationConfirmed ? "bounty.authorized" : "bounty.paused", p.name);
  });
  refresh();
}

export async function addBountyReport(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const program = s.bountyPrograms.find((x) => x.id === str(fd, "programId"));
    if (!program?.authorizationConfirmed) throw new Error("Reports can only be logged against an authorized program.");
    const r: BountyReport = { id: newId("bbr"), programId: program.id, title: str(fd, "title", 200), status: "draft", notes: str(fd, "notes", 5000), createdAt: nowIso() };
    if (!r.title) throw new Error("Title is required.");
    s.bountyReports.unshift(r);
    audit(s, "bounty.report-drafted", r.title);
  });
  refresh();
}

export async function setBountyReportStatus(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const r = s.bountyReports.find((x) => x.id === str(fd, "id"));
    if (!r) return;
    r.status = str(fd, "status") as BountyReport["status"];
    audit(s, "bounty.report-status", `${r.title} → ${r.status}`);
  });
  refresh();
}

// ---------- Decision memory (append-only) ----------

export async function addLesson(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const attempted = str(fd, "attempted", 1000);
    if (!attempted) throw new Error("Say what was attempted.");
    s.lessons.unshift({
      id: newId("les"),
      createdAt: nowIso(),
      taskId: str(fd, "taskId") || null,
      campaignId: str(fd, "campaignId") || null,
      attempted,
      toolsAndSources: str(fd, "toolsAndSources", 1000),
      happened: str(fd, "happened", 2000),
      evidence: str(fd, "evidence", 1000),
      verified: str(fd, "verified") === "on",
      failed: str(fd, "failed", 2000),
      changeNext: str(fd, "changeNext", 2000),
    });
  });
  refresh();
}

export async function markSourceChecked(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    const src = s.sources.find((x) => x.id === str(fd, "id"));
    if (!src) return;
    src.lastCheckedAt = nowIso();
    src.health = "ok";
    src.lastError = "";
    audit(s, "source.checked", src.name);
  });
  refresh();
}

// ---------- Market & simulation ----------

export async function updateWatchlist(fd: FormData) {
  assertAdmin();
  const id = str(fd, "asset", 80).toLowerCase();
  const op = str(fd, "op");
  if (!/^[a-z0-9-]+$/.test(id)) return;
  await updateStore((s) => {
    const list = s.settings.watchlist;
    if (op === "add" && !list.includes(id)) list.push(id);
    if (op === "remove") s.settings.watchlist = list.filter((x) => x !== id);
  });
  refresh();
}

export async function simTrade(fd: FormData) {
  assertAdmin();
  const asset = str(fd, "asset", 80);
  const side = str(fd, "side") === "sell" ? "sell" : "buy";
  const usd = Number(str(fd, "usd"));
  if (!asset || !(usd > 0)) throw new Error("Enter an amount above zero.");
  const live = await getLivePrice(asset);
  if (!live) throw new Error("No live price right now, so the simulated trade wasn't placed.");
  await updateStore((s) => {
    const { cash, positions } = replay(s.simulation.startingCapitalUsd, s.simulation.trades);
    const qty = usd / live.price;
    if (side === "buy" && usd > cash + 1e-6) throw new Error("Not enough virtual cash.");
    const held = positions.find((p) => p.asset === asset)?.qty ?? 0;
    if (side === "sell" && qty > held + 1e-12) throw new Error("You don't hold that much in the simulation.");
    s.simulation.trades.push({ id: newId("sim"), at: nowIso(), asset, side, qty, priceUsd: live.price, priceSource: MARKET_SOURCE, priceFetchedAt: live.fetchedAt });
    audit(s, "simulation.trade", `${side} $${usd.toFixed(2)} of ${asset} (virtual)`);
  });
  refresh();
}

export async function resetSimulation(fd: FormData) {
  assertAdmin();
  const capital = Math.min(10_000_000, Math.max(100, Number(str(fd, "capital")) || 100000));
  await updateStore((s) => {
    s.simulation = { startingCapitalUsd: capital, trades: [], resetAt: nowIso() };
    audit(s, "simulation.reset", `virtual capital $${capital}`);
  });
  refresh();
}

export async function setMascot(fd: FormData) {
  assertAdmin();
  await updateStore((s) => {
    s.settings.mascotEnabled = str(fd, "enabled") === "on";
  });
  refresh();
}
