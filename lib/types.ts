export type Visibility = "private" | "public";

export interface Achievement {
  id: string;
  title: string;
  issuer: string;
  date: string; // YYYY-MM-DD
  category: "competition" | "hackathon" | "certification" | "publication" | "open-source" | "other";
  evidenceUrl: string;
  notes: string;
  verified: boolean;
  visibility: Visibility;
  createdAt: string;
}

export type ApprovalKind = "submission" | "publication" | "cost" | "external-action";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalItem {
  id: string;
  kind: ApprovalKind;
  title: string;
  detail: string;
  module: ModuleId;
  costUsd: number;
  ref?: { type: "achievement" | "content" | "research"; id: string };
  status: ApprovalStatus;
  createdAt: string;
  decidedAt?: string;
}

export type ModuleId =
  | "scout"
  | "kaggle"
  | "hackathons"
  | "coach"
  | "research"
  | "github"
  | "content"
  | "vault"
  | "calendar"
  | "bounty";

export type Verification = "verified" | "estimated" | "unconfirmed";

export interface Provenance {
  sourceId: string | null;
  sourceUrl: string;
  retrievedAt: string;
  verification: Verification;
}

export interface Opportunity extends Provenance {
  id: string;
  kind: "competition" | "hackathon" | "bounty" | "research";
  name: string;
  platform: string;
  url: string;
  deadline: string;
  eligibility: string; // including age requirements
  aiPolicy: string;
  priority: "high" | "medium" | "low";
  status: "watching" | "entered" | "skipped";
  campaignId: string | null;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  authority: "official" | "community" | "manual";
  access: "public-api" | "needs-key" | "manual-entry";
  refresh: "daily" | "weekly" | "manual";
  permittedUse: string;
  lastCheckedAt: string | null;
  health: "ok" | "error" | "unchecked";
  lastError: string;
}

export interface FieldChange {
  at: string;
  field: string;
  from: string;
  to: string;
  by: string;
}

export interface CalendarEvent extends Provenance {
  id: string;
  externalId: string | null; // e.g. "codeforces:2051", used to dedupe imports
  title: string;
  kind: "contest" | "deadline" | "registration" | "training" | "research" | "publishing" | "approval" | "other";
  start: string; // ISO with offset
  end: string | null;
  campaignId: string | null;
  opportunityId: string | null;
  recurrence: "none" | "weekly";
  notes: string;
  history: FieldChange[];
}

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
  evidenceUrl: string;
  doneAt?: string;
}

export interface Campaign {
  id: string;
  title: string;
  platform: string;
  target: string;
  requirementsUrl: string; // official source for the requirements
  requirementsCheckedAt: string | null;
  officialStatus: string; // only from a verified source
  officialStatusEvidence: string;
  officialStatusCheckedAt: string | null;
  internalEstimate: string; // your own notes; never shown as official
  milestones: Milestone[];
  skills: string[];
  weeklyHours: number;
  restrictions: string;
  nextAction: string;
  linkedSourceIds: string[];
}

export interface Problem {
  id: string;
  platform: "LeetCode" | "Codeforces" | "AtCoder" | "USACO" | "Other";
  ref: string; // problem id or url
  title: string;
  difficulty: string;
  topics: string[];
  mode: "independent" | "assisted";
  solvedAt: string;
  reviewCount: number;
  nextReview: string;
}

export interface BountyProgram {
  id: string;
  name: string;
  platform: string;
  url: string;
  ageRequirement: string;
  inScope: string;
  outOfScope: string;
  rules: string;
  authorizationConfirmed: boolean;
  confirmedAt?: string;
  status: "researching" | "authorized" | "paused";
}

export interface BountyReport {
  id: string;
  programId: string;
  title: string;
  status: "draft" | "submitted" | "triaged" | "accepted" | "duplicate" | "rejected";
  notes: string;
  createdAt: string;
}

/** Decision memory. Append-only: nothing in the app edits or deletes a lesson. */
export interface Lesson {
  id: string;
  createdAt: string;
  taskId: string | null;
  campaignId: string | null;
  attempted: string;
  toolsAndSources: string;
  happened: string;
  evidence: string;
  verified: boolean;
  failed: string;
  changeNext: string;
}

export interface Experiment {
  id: string;
  competition: string;
  name: string;
  approach: string;
  cvScore: string;
  lbScore: string;
  notes: string;
  status: "planned" | "running" | "done" | "abandoned";
  createdAt: string;
}

export interface Hackathon {
  id: string;
  name: string;
  platform: string;
  url: string;
  deadline: string;
  stage: "idea" | "building" | "testing" | "demo" | "submitted";
  notes: string;
}

export interface ContestLog {
  id: string;
  platform: "Codeforces" | "AtCoder" | "Other";
  contest: string;
  date: string;
  solved: string;
  upsolveNotes: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  kind: "report" | "benchmark" | "dataset" | "reading";
  status: "idea" | "in-progress" | "done";
  repoUrl: string;
  summary: string;
  visibility: Visibility;
}

export interface ContentDraft {
  id: string;
  channel: "blog" | "linkedin";
  title: string;
  body: string;
  status: "draft" | "awaiting-approval" | "scheduled" | "published";
  scheduledFor: string;
  createdAt: string;
  publishedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  detail: string;
}

// ---------- Organization (Reputation OS 2.0) ----------

export type DepartmentId =
  | "executive"
  | "product"
  | "frontend"
  | "design"
  | "backend"
  | "ai"
  | "ml"
  | "hackathons"
  | "cp"
  | "brand"
  | "security"
  | "analytics"
  | "intelligence";

export interface Department {
  id: DepartmentId;
  name: string;
  headRoleId: string;
  deliverable: string;
  successMeasure: string;
}

/** A logical role: invoked when needed, never a permanently running process. */
export interface Role {
  id: string; // unique role identifier, e.g. "exec.chief-of-staff"
  title: string;
  department: DepartmentId;
  managerId: string | null; // null = reports to the founder
  responsibilities: string[];
  exclusions: string[];
  tools: string[]; // operation ids this role may run
  dataAccess: string[];
  successCriteria: string;
  monthlyBudgetUsd: number;
  maxRunsPerDay: number;
  escalation: string;
  instructionsVersion: string;
  defined: "spec" | "proposed"; // named in your spec, or filled in as a proposal
}

/** 0 Observe · 1 Prepare · 2 Execute safely · 3 Managed autonomy */
export type AutonomyLevel = 0 | 1 | 2 | 3;

export type RiskLevel = "low" | "medium" | "high";

export type TaskStatus =
  | "planned"
  | "running"
  | "in-review"
  | "awaiting-approval"
  | "done"
  | "returned"
  | "failed"
  | "cancelled";

export type GateId =
  | "requirements"
  | "implementation"
  | "automated-tests"
  | "independent-review"
  | "policy"
  | "human-approval"
  | "verification";

export interface GateResult {
  gate: GateId;
  passed: boolean;
  by: string; // role id or "founder"
  at: string;
  note: string;
}

export interface Task {
  id: string;
  idempotencyKey: string;
  title: string;
  command: string; // the instruction it came from
  source: "dashboard" | "claude-desktop" | "assistant";
  operation: string | null; // operation id, null for manual tasks
  ownerRoleId: string;
  reviewerRoleId: string;
  dependsOn: string[];
  risk: RiskLevel;
  needsApproval: boolean;
  status: TaskStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  gates: GateResult[];
  evidence: { label: string; value: string }[];
  log: string[];
  completionCriteria: string;
}

export interface Settings {
  githubUser: string;
  codeforcesHandle: string;
  atcoderHandle: string;
  kaggleUser: string;
  monthlyBudgetUsd: number;
  requireApprovalForSubmissions: boolean;
  requireApprovalForPublishing: boolean;
  autonomyLevel: AutonomyLevel;
  timezone: string;
  watchlist: string[]; // CoinGecko coin ids
  mascotEnabled: boolean;
}

/** Virtual money only. Never connected to a real account. */
export interface SimTrade {
  id: string;
  at: string;
  asset: string; // CoinGecko id
  side: "buy" | "sell";
  qty: number;
  priceUsd: number; // live price at trade time
  priceSource: string;
  priceFetchedAt: string;
}

export interface Simulation {
  startingCapitalUsd: number;
  trades: SimTrade[];
  resetAt: string;
}

export interface Store {
  settings: Settings;
  approvals: ApprovalItem[];
  achievements: Achievement[];
  opportunities: Opportunity[];
  experiments: Experiment[];
  hackathons: Hackathon[];
  contests: ContestLog[];
  research: ResearchItem[];
  content: ContentDraft[];
  messages: ContactMessage[];
  audit: AuditEntry[];
  tasks: Task[];
  sources: Source[];
  events: CalendarEvent[];
  campaigns: Campaign[];
  problems: Problem[];
  bountyPrograms: BountyProgram[];
  bountyReports: BountyReport[];
  lessons: Lesson[];
  simulation: Simulation;
  githubCache: { fetchedAt: string; repos: RepoSnapshot[] } | null;
  codeforcesCache: { fetchedAt: string; handle: string; rating: number | null; maxRating: number | null; rank: string | null; contests: number } | null;
}

export interface RepoSnapshot {
  name: string;
  description: string;
  url: string;
  language: string | null;
  stars: number;
  pushedAt: string;
  fork: boolean;
}
