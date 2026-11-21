// Local JSON data store. It lets the whole platform run with no API keys.
// Phase 2 swaps this file's internals for Supabase; the function names stay the same,
// so pages and actions don't change. Server-side only.
import { promises as fs } from "fs";
import path from "path";
import type { Store } from "./types";
import { seedStore } from "./seed";

/** Resolved on every call so DATA_DIR (or the working directory) can change, e.g. in tests. */
function storePath(): string {
  return path.join(process.env.DATA_DIR ?? path.join(process.cwd(), "data"), "store.json");
}

/** Writes need a real disk. Vercel's filesystem is read-only, so production builds are read-only
 *  until the Supabase backend is connected. */
export function canWrite(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DATA_BACKEND === "file";
}

export async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    // Fill any collections or settings added after the file was created.
    const seed = seedStore();
    return { ...seed, ...parsed, settings: { ...seed.settings, ...(parsed.settings ?? {}) } } as Store;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return seedStore();
    throw err;
  }
}

let writeChain: Promise<unknown> = Promise.resolve();

/** Read-modify-write, serialized so two quick actions can't overwrite each other. */
export async function updateStore(mutate: (s: Store) => void | Promise<void>): Promise<Store> {
  if (!canWrite()) {
    throw new Error("Saving is turned off in production until the database is connected.");
  }
  const run = writeChain.then(async () => {
    const store = await readStore();
    await mutate(store);
    const file = storePath();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(store, null, 2) + "\n", "utf8");
    await fs.rename(tmp, file);
    return store;
  });
  writeChain = run.catch(() => undefined);
  return run;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
