import { PageHead, Panel, Pill } from "@/components/ui";
import { updateSettings } from "@/lib/actions";
import { setMascot } from "@/lib/actions-intel";
import { AUTONOMY_LEVELS, ROLES } from "@/lib/org";
import { readStore } from "@/lib/store";

const INTEGRATIONS = [
  { name: "Supabase (database + sign-in)", env: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY", unlocks: "Saving on the live site, sign-in for the admin, durable job queue" },
  { name: "Kaggle API", env: "KAGGLE_USERNAME, KAGGLE_KEY", unlocks: "Competitions, kernels and submission scores in the Kaggle lab" },
  { name: "Anthropic API", env: "ANTHROPIC_API_KEY", unlocks: "AI Chief of Staff planner, website assistant" },
  { name: "GitHub token", env: "GITHUB_TOKEN", unlocks: "Higher rate limit, issues, pull requests, releases" },
  { name: "CoinGecko Demo key", env: "COINGECKO_DEMO_API_KEY", unlocks: "Higher market-data rate limits" },
];

export default async function Settings() {
  const s = await readStore();
  const st = s.settings;
  const roleBudget = ROLES.reduce((n, r) => n + r.monthlyBudgetUsd, 0);
  return (
    <>
      <PageHead title="Settings & budgets" />
      <div className="grid two">
        <Panel title="Accounts and limits">
          <form action={updateSettings} className="form">
            <div className="row">
              <label>GitHub username<input type="text" name="githubUser" defaultValue={st.githubUser} /></label>
              <label>Codeforces handle<input type="text" name="codeforcesHandle" defaultValue={st.codeforcesHandle} /></label>
            </div>
            <div className="row">
              <label>AtCoder handle<input type="text" name="atcoderHandle" defaultValue={st.atcoderHandle} /></label>
              <label>Kaggle username<input type="text" name="kaggleUser" defaultValue={st.kaggleUser} /></label>
            </div>
            <div className="row">
              <label>Time zone<input type="text" name="timezone" defaultValue={st.timezone} /></label>
              <label>Monthly spending cap (USD)<input type="number" name="monthlyBudgetUsd" min={0} defaultValue={st.monthlyBudgetUsd} /></label>
            </div>
            <label>Autonomy level
              <select name="autonomyLevel" defaultValue={st.autonomyLevel}>
                {AUTONOMY_LEVELS.map((l) => <option key={l.level} value={l.level}>{l.level}: {l.name}</option>)}
              </select>
            </label>
            <p className="meta">{AUTONOMY_LEVELS[st.autonomyLevel].summary}</p>
            <p className="meta">Publishing and submissions always need your approval. That setting can't be turned off.</p>
            <div className="actions"><button className="btn" type="submit">Save settings</button></div>
          </form>
        </Panel>
        <div className="stack" style={{ gap: 16 }}>
          <Panel title="Budgets" sub="Today every live operation uses free public APIs, so spend is $0.">
            <dl className="stack" style={{ margin: 0 }}>
              <div className="inline" style={{ justifyContent: "space-between" }}><dt className="muted">Monthly cap</dt><dd style={{ margin: 0 }}>${st.monthlyBudgetUsd}</dd></div>
              <div className="inline" style={{ justifyContent: "space-between" }}><dt className="muted">Allocated to roles</dt><dd style={{ margin: 0 }}>${roleBudget}</dd></div>
              <div className="inline" style={{ justifyContent: "space-between" }}><dt className="muted">Spent this month</dt><dd style={{ margin: 0 }}>$0</dd></div>
            </dl>
          </Panel>
          <Panel title="Nyx">
            <form action={setMascot} className="inline" style={{ justifyContent: "space-between" }}>
              <label className="check"><input type="checkbox" name="enabled" defaultChecked={st.mascotEnabled} /> Show Nyx in the admin</label>
              <button className="btn quiet small" type="submit">Save</button>
            </form>
            <p className="meta" style={{ marginTop: 8 }}>Drag Nyx to any corner, or focus it and use the arrow keys. Nyx stays still when your system asks for reduced motion.</p>
          </Panel>
          <Panel title="Integrations" sub="Add keys to .env.local on your machine or in Vercel's environment settings. Never in the code.">
            <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 12 }}>
              {INTEGRATIONS.map((i) => (
                <li key={i.name}>
                  <div className="inline" style={{ justifyContent: "space-between" }}><strong style={{ fontSize: "var(--t-sm)" }}>{i.name}</strong><Pill>not connected</Pill></div>
                  <p className="meta">{i.unlocks}</p>
                  <code className="meta">{i.env}</code>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
