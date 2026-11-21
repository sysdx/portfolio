// Command API: the shared surface for the website assistant and Claude Desktop (via an MCP
// wrapper in phase 3). Same records, same gates, same idempotency as the dashboard.
import { NextResponse } from "next/server";
import { adminEnabled } from "@/lib/guard";
import { readStore } from "@/lib/store";
import { createTask, runTask } from "@/lib/workflow";

function authorized(req: Request): boolean {
  if (!adminEnabled()) return false;
  const token = process.env.COMMAND_API_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production"; // local only until a token is set
  return req.headers.get("authorization") === `Bearer ${token}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await readStore();
  const status = new URL(req.url).searchParams.get("status");
  const tasks = status ? s.tasks.filter((t) => t.status === status) : s.tasks;
  return NextResponse.json({ tasks: tasks.slice(0, 100) });
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const key = req.headers.get("idempotency-key");
  if (!key || key.length > 100) return NextResponse.json({ error: "Idempotency-Key header is required" }, { status: 400 });
  let body: { command?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON: { command }" }, { status: 400 });
  }
  const command = typeof body.command === "string" ? body.command.trim().slice(0, 500) : "";
  if (!command) return NextResponse.json({ error: "command is required" }, { status: 400 });
  const source = body.source === "assistant" ? "assistant" : "claude-desktop";
  const { task, duplicate } = await createTask({ command, idempotencyKey: key, source });
  const final = !duplicate && task.operation && !task.needsApproval ? await runTask(task.id) : task;
  return NextResponse.json({ task: final, duplicate }, { status: duplicate ? 200 : 201 });
}
