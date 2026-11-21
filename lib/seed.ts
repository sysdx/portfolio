import type { Campaign, Source, Store } from "./types";

const SOURCES: Source[] = [
  { id: "src.codeforces-api", name: "Codeforces API", url: "https://codeforces.com/apiHelp", authority: "official", access: "public-api", refresh: "daily", permittedUse: "Public read-only methods: contest list, user info, rating history", lastCheckedAt: null, health: "unchecked", lastError: "" },
  { id: "src.github-api", name: "GitHub REST API", url: "https://docs.github.com/rest", authority: "official", access: "public-api", refresh: "daily", permittedUse: "Public repository metadata for your own account", lastCheckedAt: null, health: "unchecked", lastError: "" },
  { id: "src.kaggle-api", name: "Kaggle API", url: "https://www.kaggle.com/docs/api", authority: "official", access: "needs-key", refresh: "daily", permittedUse: "Your competitions, datasets, kernels and submissions (needs your API token)", lastCheckedAt: null, health: "unchecked", lastError: "" },
  { id: "src.kaggle-progression", name: "Kaggle progression system", url: "https://www.kaggle.com/progression", authority: "official", access: "manual-entry", refresh: "manual", permittedUse: "Tier and medal requirements, checked by hand", lastCheckedAt: null, health: "unchecked", lastError: "" },
  { id: "src.atcoder", name: "AtCoder contests", url: "https://atcoder.jp/contests/", authority: "official", access: "manual-entry", refresh: "manual", permittedUse: "Contest schedule and rules, entered by hand (no official API)", lastCheckedAt: null, health: "unchecked", lastError: "" },
  { id: "src.leetcode", name: "LeetCode profile", url: "https://leetcode.com/", authority: "official", access: "manual-entry", refresh: "manual", permittedUse: "Your solved problems, entered by hand", lastCheckedAt: null, health: "unchecked", lastError: "" },
  { id: "src.devpost", name: "Devpost hackathons", url: "https://devpost.com/hackathons", authority: "official", access: "manual-entry", refresh: "manual", permittedUse: "Hackathon listings and rules, entered by hand", lastCheckedAt: null, health: "unchecked", lastError: "" },
];

function campaign(c: Partial<Campaign> & Pick<Campaign, "id" | "title" | "platform" | "target" | "requirementsUrl">): Campaign {
  return {
    requirementsCheckedAt: null,
    officialStatus: "",
    officialStatusEvidence: "",
    officialStatusCheckedAt: null,
    internalEstimate: "",
    milestones: [],
    skills: [],
    weeklyHours: 0,
    restrictions: "",
    nextAction: "",
    linkedSourceIds: [],
    ...c,
  };
}

/** Your goals, set up as campaigns. Targets only: no status is filled in until it is verified. */
const CAMPAIGNS: Campaign[] = [
  campaign({ id: "cmp.kaggle-competitions", title: "Kaggle Competitions Grandmaster", platform: "Kaggle", target: "Competitions Grandmaster", requirementsUrl: "https://www.kaggle.com/progression", restrictions: "Check each competition's rules, team and AI-use policies before entering.", nextAction: "Confirm current tier requirements on the official progression page.", linkedSourceIds: ["src.kaggle-progression", "src.kaggle-api"] }),
  campaign({ id: "cmp.kaggle-datasets", title: "Kaggle Datasets Grandmaster", platform: "Kaggle", target: "Datasets Grandmaster", requirementsUrl: "https://www.kaggle.com/progression", restrictions: "Only publish data you have the rights to share. Quality over volume.", nextAction: "Confirm current tier requirements on the official progression page.", linkedSourceIds: ["src.kaggle-progression"] }),
  campaign({ id: "cmp.kaggle-code", title: "Kaggle Code Grandmaster", platform: "Kaggle", target: "Code (notebooks) Grandmaster", requirementsUrl: "https://www.kaggle.com/progression", restrictions: "Notebooks must be your own reproducible work.", nextAction: "Confirm current tier requirements on the official progression page.", linkedSourceIds: ["src.kaggle-progression"] }),
  campaign({ id: "cmp.codeforces", title: "Codeforces 2500+", platform: "Codeforces", target: "Rating 2500+", requirementsUrl: "https://codeforces.com/", restrictions: "No AI assistance during rated contests. Practice and upsolving only.", nextAction: "Add your handle in Settings and run the Codeforces sync.", linkedSourceIds: ["src.codeforces-api"] }),
  campaign({ id: "cmp.atcoder", title: "AtCoder Red", platform: "AtCoder", target: "Rating 2800+", requirementsUrl: "https://atcoder.jp/", restrictions: "Follow AtCoder's rules on generative AI in rated contests.", nextAction: "Add your handle in Settings and log your first contest.", linkedSourceIds: ["src.atcoder"] }),
  campaign({ id: "cmp.leetcode", title: "LeetCode 3,000 solved", platform: "LeetCode", target: "3,000 unique problems solved independently", requirementsUrl: "https://leetcode.com/", restrictions: "Only independent solves count toward the target; assisted ones are tracked separately.", nextAction: "Log solved problems in the Academy.", linkedSourceIds: ["src.leetcode"] }),
  campaign({ id: "cmp.devpost", title: "Devpost hackathon results", platform: "Devpost", target: "Verified hackathon placements", requirementsUrl: "https://devpost.com/hackathons", restrictions: "Check age, location and AI-use rules for every event.", nextAction: "Add an eligible hackathon to the radar.", linkedSourceIds: ["src.devpost"] }),
  campaign({ id: "cmp.bounty", title: "Verified bug bounty findings", platform: "Bug bounty programs", target: "Accepted, in-scope findings", requirementsUrl: "", restrictions: "Only test programs you're eligible for (including age rules), only in scope, only after recording authorization. Nothing automated against third-party systems.", nextAction: "Practice on legal labs first; record a program's scope before any testing.", linkedSourceIds: [] }),
];

/** Empty starting state. Nothing here is presented as a real result. */
export function seedStore(): Store {
  return {
    settings: {
      githubUser: "sysdx",
      codeforcesHandle: "",
      atcoderHandle: "",
      kaggleUser: "",
      monthlyBudgetUsd: 0,
      requireApprovalForSubmissions: true,
      requireApprovalForPublishing: true,
      autonomyLevel: 2,
      timezone: "America/New_York",
      watchlist: ["bitcoin", "ethereum", "solana"],
      mascotEnabled: true,
    },
    approvals: [],
    achievements: [],
    opportunities: [],
    experiments: [],
    hackathons: [],
    contests: [],
    research: [],
    content: [],
    messages: [],
    audit: [],
    tasks: [],
    sources: structuredClone(SOURCES),
    events: [],
    campaigns: structuredClone(CAMPAIGNS),
    problems: [],
    bountyPrograms: [],
    bountyReports: [],
    lessons: [],
    simulation: { startingCapitalUsd: 100000, trades: [], resetAt: new Date(0).toISOString() },
    githubCache: null,
    codeforcesCache: null,
  };
}
