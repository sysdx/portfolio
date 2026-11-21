import type { Metadata } from "next";
import { AdminNav, type NavGroup } from "@/components/AdminNav";
import { Nyx } from "@/components/Nyx";
import { computeMood } from "@/lib/mood";
import { readStore } from "@/lib/store";

export const metadata: Metadata = { title: "Reputation OS", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await readStore();
  const pending = s.approvals.filter((a) => a.status === "pending").length + s.tasks.filter((t) => t.status === "awaiting-approval").length;
  const unread = s.messages.filter((m) => !m.read).length;
  const today = new Date().toISOString().slice(0, 10);
  const due = s.problems.filter((p) => p.nextReview <= today).length;
  const groups: NavGroup[] = [
    { title: "Command", items: [
      { href: "/admin", label: "Command center" },
      { href: "/admin/tasks", label: "Task ledger" },
      { href: "/admin/approvals", label: "Approval center", count: pending },
      { href: "/admin/calendar", label: "Calendar" },
    ] },
    { title: "Organization", items: [
      { href: "/admin/org", label: "Org chart & roles" },
    ] },
    { title: "Intelligence", items: [
      { href: "/admin/intel", label: "Sources & radar" },
      { href: "/admin/campaigns", label: "Campaigns" },
      { href: "/admin/lessons", label: "Decision memory" },
    ] },
    { title: "Work", items: [
      { href: "/admin/kaggle", label: "Kaggle lab" },
      { href: "/admin/hackathons", label: "Hackathons" },
      { href: "/admin/academy", label: "CP academy", count: due },
      { href: "/admin/bounty", label: "Bug bounty" },
      { href: "/admin/research", label: "Research" },
      { href: "/admin/github", label: "GitHub" },
      { href: "/admin/content", label: "Content studio" },
      { href: "/admin/market", label: "Market intelligence" },
    ] },
    { title: "Proof", items: [
      { href: "/admin/vault", label: "Achievement vault" },
      { href: "/admin/messages", label: "Messages", count: unread },
    ] },
    { title: "System", items: [
      { href: "/admin/settings", label: "Settings & budgets" },
      { href: "/admin/audit", label: "Security & audit" },
    ] },
  ];
  const { mood, say } = computeMood(s);
  return (
    <div className="adm">
      <AdminNav groups={groups} />
      <main className="adm-main" id="main">{children}</main>
      {s.settings.mascotEnabled && <Nyx mood={mood} say={say} />}
    </div>
  );
}
