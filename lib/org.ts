// The organization registry. Roles live in code (versioned in git), not in the database,
// so every change to a role's instructions or permissions is reviewable.
import type { Department, DepartmentId, Role } from "./types";

export const DEPARTMENTS: Department[] = [
  { id: "executive", name: "Executive Office", headRoleId: "exec.chief-of-staff", deliverable: "Priorities, operating plans, budgets and weekly reviews", successMeasure: "Completed priorities, budget adherence and delivery quality" },
  { id: "product", name: "Product & Architecture", headRoleId: "product.cpo", deliverable: "Specs, architecture decisions and acceptance criteria", successMeasure: "Features shipped that meet their acceptance criteria" },
  { id: "frontend", name: "Frontend Engineering", headRoleId: "frontend.director", deliverable: "Accessible, fast interfaces for the portfolio and admin", successMeasure: "Usability, accessibility, responsiveness and performance" },
  { id: "design", name: "Motion & Visual Design", headRoleId: "design.cdo", deliverable: "Design system, motion language and visual assets", successMeasure: "Usability, accessibility, responsiveness and performance" },
  { id: "backend", name: "Backend & Infrastructure", headRoleId: "backend.cto", deliverable: "Reliable APIs, storage, jobs, deployments and integrations", successMeasure: "Verified working features, reliability, test coverage" },
  { id: "ai", name: "AI Systems", headRoleId: "ai.caio", deliverable: "Working agents, reliable tool calls, evaluations and cost controls", successMeasure: "Successful authorized workflows, error rate, cost per completed task" },
  { id: "ml", name: "ML Research & Kaggle", headRoleId: "ml.cro", deliverable: "Reproducible experiments and validated improvements", successMeasure: "Validated improvements, reproducibility, eligible medals" },
  { id: "hackathons", name: "Hackathon Operations", headRoleId: "hack.director", deliverable: "Eligible, finished hackathon entries with demos", successMeasure: "Finished eligible entries, verified placements" },
  { id: "cp", name: "Competitive Programming", headRoleId: "cp.director", deliverable: "Practice plans and post-contest reviews (never live-contest help)", successMeasure: "Independently solved problems and actual rating progress" },
  { id: "brand", name: "Brand & Publishing", headRoleId: "brand.cgo", deliverable: "Case studies and posts built only from verified facts", successMeasure: "Meaningful engagement, quality collaborations, verified reach" },
  { id: "security", name: "Security & Quality", headRoleId: "security.director", deliverable: "Independent review, policy checks and permission enforcement", successMeasure: "Policy violations prevented, vulnerabilities resolved" },
  { id: "analytics", name: "Analytics & Intelligence", headRoleId: "analytics.director", deliverable: "Honest metrics, progress reports and opportunity intelligence", successMeasure: "Decisions backed by accurate, current data" },
  { id: "intelligence", name: "Chief Intelligence Office", headRoleId: "intel.cio", deliverable: "Trustworthy, current, sourced facts for every decision", successMeasure: "Facts with sources and fresh timestamps; stale or conflicting data flagged" },
];

type RoleSeed = {
  id: string;
  title: string;
  managerId: string | null;
  does: string;
  tools?: string[];
  defined?: "spec" | "proposed";
  budget?: number;
};

const COMMON_EXCLUSIONS = [
  "Never impersonates the founder or posts as them",
  "Never fabricates achievements, scores or credentials",
  "Never approves its own work",
];

function build(department: DepartmentId, seeds: RoleSeed[]): Role[] {
  return seeds.map((r) => ({
    id: r.id,
    title: r.title,
    department,
    managerId: r.managerId,
    responsibilities: r.does.split(";").map((s) => s.trim()).filter(Boolean),
    exclusions: department === "cp" ? [...COMMON_EXCLUSIONS, "No assistance of any kind during live rated contests"] : COMMON_EXCLUSIONS,
    tools: r.tools ?? [],
    dataAccess: department === "security" ? ["read: all records", "write: gate results"] : [`read/write: ${department} records`],
    successCriteria: DEPARTMENTS.find((d) => d.id === department)!.successMeasure,
    monthlyBudgetUsd: r.budget ?? 0,
    maxRunsPerDay: r.tools?.length ? 24 : 0,
    escalation: r.managerId ? `Escalates to ${r.managerId}` : "Escalates to the founder",
    instructionsVersion: "v1",
    defined: r.defined ?? "spec",
  }));
}

export const ROLES: Role[] = [
  ...build("executive", [
    { id: "exec.chief-of-staff", title: "AI Chief of Staff", managerId: null, does: "Turns founder instructions into tasks; assigns owners and reviewers; resolves dependencies; prepares decisions" },
    { id: "exec.strategy", title: "Strategic Planning Director", managerId: "exec.chief-of-staff", does: "Quarterly priorities; trade-off analysis" },
    { id: "exec.program-manager", title: "Program Manager", managerId: "exec.chief-of-staff", does: "Tracks milestones and dependencies; owns manual tasks until assigned" },
    { id: "exec.ops-analyst", title: "Operations Analyst", managerId: "exec.chief-of-staff", does: "Weekly review of throughput, failures and blockers" },
    { id: "exec.budget", title: "Resource & Budget Planner", managerId: "exec.chief-of-staff", does: "Sets and enforces per-role budgets; flags overspend" },
  ]),
  ...build("product", [
    { id: "product.cpo", title: "Chief Product Officer", managerId: "exec.chief-of-staff", does: "Owns the platform roadmap; defines acceptance criteria" },
    { id: "product.pm", title: "Product Manager", managerId: "product.cpo", does: "Writes specs; prioritizes backlog", defined: "proposed" },
    { id: "product.architect", title: "Systems Architect", managerId: "product.cpo", does: "Architecture decisions; data model reviews", defined: "proposed" },
    { id: "product.ux-research", title: "UX Researcher", managerId: "product.cpo", does: "Tests flows with the founder; reports friction", defined: "proposed" },
    { id: "product.tech-writer", title: "Technical Writer", managerId: "product.cpo", does: "Docs, runbooks and READMEs", defined: "proposed" },
  ]),
  ...build("frontend", [
    { id: "frontend.director", title: "Frontend Engineering Director", managerId: "backend.cto", does: "Owns UI quality across portfolio and admin" },
    { id: "frontend.ui", title: "UI Engineer", managerId: "frontend.director", does: "Builds pages and components", defined: "proposed" },
    { id: "frontend.a11y", title: "Accessibility Engineer", managerId: "frontend.director", does: "Keyboard, contrast and screen-reader checks", defined: "proposed" },
    { id: "frontend.perf", title: "Performance Engineer", managerId: "frontend.director", does: "Bundle size and Core Web Vitals", defined: "proposed" },
    { id: "frontend.test", title: "Frontend Test Engineer", managerId: "frontend.director", does: "Browser tests on desktop and phone widths", defined: "proposed" },
  ]),
  ...build("design", [
    { id: "design.cdo", title: "Chief Design Officer", managerId: "exec.chief-of-staff", does: "Visual identity and motion language" },
    { id: "design.visual", title: "Visual Designer", managerId: "design.cdo", does: "Layouts, type and color", defined: "proposed" },
    { id: "design.motion", title: "Motion Designer", managerId: "design.cdo", does: "Transitions that explain state changes", defined: "proposed" },
    { id: "design.system", title: "Design Systems Lead", managerId: "design.cdo", does: "Tokens and shared components", defined: "proposed" },
    { id: "design.assets", title: "Brand Asset Designer", managerId: "design.cdo", does: "Open Graph images and project visuals", defined: "proposed" },
  ]),
  ...build("backend", [
    { id: "backend.cto", title: "Chief Technology Officer", managerId: "exec.chief-of-staff", does: "Engineering and architecture; owns reliability" },
    { id: "backend.api", title: "Backend API Engineer", managerId: "backend.cto", does: "Typed APIs and server actions" },
    { id: "backend.db", title: "Database Engineer", managerId: "backend.cto", does: "Schema, migrations, row level security" },
    { id: "backend.sre", title: "DevOps/SRE Engineer", managerId: "backend.cto", does: "Deployments, monitoring, backups" },
    { id: "backend.workflow", title: "Workflow & Queue Engineer", managerId: "backend.cto", does: "Durable jobs, retries and idempotency" },
    { id: "backend.integration", title: "Integration Engineer", managerId: "backend.cto", does: "Connects external services through official APIs", tools: ["github.sync"] },
  ]),
  ...build("ai", [
    { id: "ai.caio", title: "Chief AI Officer", managerId: "exec.chief-of-staff", does: "Models and agent systems; autonomy policy" },
    { id: "ai.orchestration", title: "Agent Orchestration Engineer", managerId: "ai.caio", does: "Routes tasks between roles" },
    { id: "ai.prompt", title: "Prompt & Context Engineer", managerId: "ai.caio", does: "Versioned role instructions" },
    { id: "ai.tools", title: "Tool Integration Engineer", managerId: "ai.caio", does: "Defines operations roles may call" },
    { id: "ai.eval", title: "AI Evaluation Engineer", managerId: "ai.caio", does: "Evaluation tests for each role" },
    { id: "ai.cost", title: "Inference Cost Optimizer", managerId: "ai.caio", does: "Tracks and reduces cost per completed task" },
  ]),
  ...build("ml", [
    { id: "ml.cro", title: "Chief Research Officer", managerId: "exec.chief-of-staff", does: "ML research and Kaggle strategy" },
    { id: "ml.analyst", title: "Competition Analyst", managerId: "ml.cro", does: "Reads rules, metrics and data; proposes baselines", defined: "proposed" },
    { id: "ml.data", title: "Data Engineer", managerId: "ml.cro", does: "Feature pipelines and dataset versioning", defined: "proposed" },
    { id: "ml.modeling", title: "Modeling Scientist", managerId: "ml.cro", does: "Model experiments", defined: "proposed" },
    { id: "ml.validation", title: "Validation & Reproducibility Engineer", managerId: "ml.cro", does: "CV design; reruns experiments to confirm results", defined: "proposed" },
    { id: "ml.tracker", title: "Experiment Tracker", managerId: "ml.cro", does: "Logs every experiment with its score and config", defined: "proposed" },
  ]),
  ...build("hackathons", [
    { id: "hack.competition-director", title: "Competition Director", managerId: "exec.chief-of-staff", does: "Owns hackathons and programming; verifies eligibility and AI-use rules before entry" },
    { id: "hack.director", title: "Hackathon Director", managerId: "hack.competition-director", does: "Runs hackathon entries end to end" },
    { id: "hack.scout", title: "Opportunity Scout", managerId: "hack.director", does: "Finds eligible events", defined: "proposed" },
    { id: "hack.rules", title: "Rules & Eligibility Analyst", managerId: "hack.director", does: "Age, location and AI-use rules per event", defined: "proposed" },
    { id: "hack.prototype", title: "Prototype Engineer", managerId: "hack.director", does: "Builds permitted prototypes", defined: "proposed" },
    { id: "hack.demo", title: "Demo Producer", managerId: "hack.director", does: "Demo scripts and videos", defined: "proposed" },
  ]),
  ...build("cp", [
    { id: "cp.director", title: "Algorithm Training Director", managerId: "hack.competition-director", does: "Training plan for Codeforces and AtCoder" },
    { id: "cp.planner", title: "Practice Planner", managerId: "cp.director", does: "Weekly problem sets at the right rating", defined: "proposed" },
    { id: "cp.curator", title: "Problem Curator", managerId: "cp.director", does: "Picks problems by topic weakness", defined: "proposed" },
    { id: "cp.post-contest", title: "Post-Contest Analyst", managerId: "cp.director", does: "Upsolve reviews after contests end", defined: "proposed" },
    { id: "cp.rating", title: "Rating Analyst", managerId: "cp.director", does: "Tracks rating history from public APIs", tools: ["codeforces.sync"], defined: "proposed" },
  ]),
  ...build("brand", [
    { id: "brand.cgo", title: "Chief Growth Officer", managerId: "exec.chief-of-staff", does: "Personal brand and outreach strategy" },
    { id: "brand.case-study", title: "Case Study Writer", managerId: "brand.cgo", does: "Portfolio entries from verified results", defined: "proposed" },
    { id: "brand.social", title: "Social Editor", managerId: "brand.cgo", does: "LinkedIn drafts for founder approval", defined: "proposed" },
    { id: "brand.fact-checker", title: "Fact Checker", managerId: "brand.cgo", does: "Checks every public claim against evidence", tools: ["claims.audit"], defined: "proposed" },
    { id: "brand.scheduler", title: "Publishing Scheduler", managerId: "brand.cgo", does: "Schedules approved posts", defined: "proposed" },
  ]),
  ...build("security", [
    { id: "security.director", title: "Security Director", managerId: "exec.chief-of-staff", does: "Rules, privacy and permissions" },
    { id: "security.qa", title: "QA Reviewer", managerId: "security.director", does: "Independent review of every deliverable", defined: "proposed" },
    { id: "security.engineer", title: "Security Engineer", managerId: "security.director", does: "Secrets, auth and dependency checks", defined: "proposed" },
    { id: "security.policy", title: "Policy & Rules Auditor", managerId: "security.director", does: "Competition rules and autonomy limits", defined: "proposed" },
    { id: "security.privacy", title: "Privacy Officer", managerId: "security.director", does: "Personal data handling", defined: "proposed" },
  ]),
  ...build("analytics", [
    { id: "analytics.director", title: "Intelligence Director", managerId: "exec.chief-of-staff", does: "Metrics and intelligence" },
    { id: "analytics.metrics", title: "Metrics Analyst", managerId: "analytics.director", does: "Department scorecards", defined: "proposed" },
    { id: "analytics.intel", title: "Competitive Intelligence Analyst", managerId: "analytics.director", does: "Tracks competitions and trends", defined: "proposed" },
    { id: "analytics.reporting", title: "Reporting Analyst", managerId: "analytics.director", does: "Weekly founder report", defined: "proposed" },
    { id: "analytics.quality", title: "Data Quality Analyst", managerId: "analytics.director", does: "Detects stale or inconsistent data", defined: "proposed" },
  ]),
  ...build("intelligence", [
    { id: "intel.cio", title: "Chief Intelligence Officer", managerId: "exec.chief-of-staff", does: "Owns intelligence quality and prioritization" },
    { id: "intel.source-acquisition", title: "Source Acquisition Engineer", managerId: "intel.cio", does: "Builds compliant API and collection connectors", tools: ["codeforces.contests"] },
    { id: "intel.data-reliability", title: "Data Reliability Engineer", managerId: "intel.cio", does: "Detects missing, inconsistent and outdated records", tools: ["intel.freshness"] },
    { id: "intel.rules", title: "Rules Intelligence Analyst", managerId: "intel.cio", does: "Tracks competition restrictions and eligibility" },
    { id: "intel.ranking", title: "Opportunity Ranking Scientist", managerId: "intel.cio", does: "Scores opportunities by learning value, time, cost, eligibility and evidence quality; never invents win probabilities" },
    { id: "intel.experiments", title: "Experiment Intelligence Analyst", managerId: "intel.cio", does: "Learns from historical research outcomes" },
    { id: "intel.skills", title: "Skill Intelligence Analyst", managerId: "intel.cio", does: "Builds personalized learning recommendations" },
    { id: "intel.forecasting", title: "Forecasting & Calibration Analyst", managerId: "intel.cio", does: "Compares predictions with actual results once enough real data exists" },
  ]),
];

export function getRole(id: string): Role | undefined {
  return ROLES.find((r) => r.id === id);
}

export function rolesIn(dept: DepartmentId): Role[] {
  return ROLES.filter((r) => r.department === dept);
}

export function getDepartment(id: DepartmentId): Department {
  return DEPARTMENTS.find((d) => d.id === id)!;
}

export const AUTONOMY_LEVELS = [
  { level: 0, name: "Observe", summary: "Roles read and report. Nothing runs." },
  { level: 1, name: "Prepare", summary: "Roles prepare tasks; every run waits for your approval." },
  { level: 2, name: "Execute safely", summary: "Pre-authorized, reversible internal tasks run within limits. External actions stay gated." },
  { level: 3, name: "Managed autonomy", summary: "Medium-risk workflows that have passed testing also run on their own." },
] as const;

/** Head roles count as leadership; everything else is a specialist. */
export function specialistCount(): number {
  const heads = new Set([...DEPARTMENTS.map((d) => d.headRoleId), "hack.competition-director"]);
  return ROLES.filter((r) => !heads.has(r.id)).length;
}
