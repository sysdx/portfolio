import { randomUUID } from "crypto";
import { submitCommand } from "@/lib/actions";
import { KNOWN_COMMANDS } from "@/lib/workflow";

/** Each render gets a fresh idempotency key, so a double-submit creates one task, not two. */
export function CommandBar() {
  return (
    <form action={submitCommand}>
      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
      <label className="sr-only" htmlFor="command">Command</label>
      <div className="command">
        <input id="command" name="command" type="text" placeholder="Tell the Chief of Staff what to do" required maxLength={500} autoComplete="off" />
        <button className="btn" type="submit">Create task</button>
      </div>
      <div className="cmd-examples">
        <span className="meta" style={{ alignSelf: "center" }}>Understood today:</span>
        {KNOWN_COMMANDS.map((c) => (
          <span key={c.id} className="pill plain">{c.example}</span>
        ))}
      </div>
      <p className="meta" style={{ marginTop: 8 }}>Anything else becomes a manual task for the Program Manager. Natural-language planning arrives with the AI model key.</p>
    </form>
  );
}
