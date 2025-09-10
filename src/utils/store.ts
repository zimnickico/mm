import * as path from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Store = Record<string, any>;

function storePathHelper(md: string) {
  const dir = path.dirname(md);
  const base = path.basename(md) + ".broadcast.json";
  return path.join(dir, ".broadcasts", base);
}

export function readStore(md: string): Store | null {
  const modern = storePathHelper(md);
  const p = existsSync(modern) ? modern : null;
  if (!p) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

export function writeStore(md: string, obj: Store) {
  const p = storePathHelper(md);
  const dir = path.dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2));
}

export function updateStore(md: string, patch: Store): Store {
  const current = readStore(md) ?? {};
  const next = { ...current, ...patch } as Store;
  writeStore(md, next);
  return next;
}
