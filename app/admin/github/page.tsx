import { randomUUID } from "crypto";
import { Empty, PageHead, Panel } from "@/components/ui";
import { submitCommand } from "@/lib/actions";
import { ago, fmtDate, fmtDateTime } from "@/lib/format";
import { readStore } from "@/lib/store";

export default async function GitHub() {
  const s = await readStore();
  const cache = s.githubCache;
  const stale = cache ? cache.repos.filter((r) => Date.now() - Date.parse(r.pushedAt) > 180 * 86400000) : [];
  return (
    <>
      <PageHead title="GitHub" intro={`Public repositories for ${s.settings.githubUser || "(set your username in Settings)"}. Issues, pull requests and releases need a GitHub token (phase 2).`}>
        <form action={submitCommand}>
          <input type="hidden" name="command" value="Sync my GitHub repos" />
          <input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <button className="btn small" type="submit">Sync now</button>
        </form>
      </PageHead>
      {!cache ? <Empty title="Not synced yet">Run a sync: the Integration Engineer fetches your repos and the QA Reviewer checks the result.</Empty> : (
        <Panel title={`${cache.repos.length} repositories`} sub={`Synced ${fmtDateTime(cache.fetchedAt, s.settings.timezone)} (${ago(cache.fetchedAt)})`}>
          {stale.length > 0 && <p className="notice info">{stale.length} repositories haven't been pushed to in 6 months: {stale.map((r) => r.name).join(", ")}.</p>}
          <div className="table-wrap"><table>
            <thead><tr><th>Repository</th><th>Language</th><th className="num">Stars</th><th>Last push</th></tr></thead>
            <tbody>{cache.repos.map((r) => (
              <tr key={r.name}><td><a href={r.url}>{r.name}</a>{r.fork && <span className="meta"> fork</span>}{r.description && <div className="meta">{r.description}</div>}</td><td className="muted">{r.language ?? "—"}</td><td className="num">{r.stars}</td><td className="meta">{fmtDate(r.pushedAt)}</td></tr>
            ))}</tbody>
          </table></div>
        </Panel>
      )}
    </>
  );
}
