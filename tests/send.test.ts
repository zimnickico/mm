import { describe, it, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { sendWithOptionalTemplate } from "../src/cmds/send";
import { createBroadcast } from "../src/cmds/create";
import { checkTemplate } from "../src/utils/template";

const repoRoot = path.resolve(import.meta.dir, "..");
const mdPath = path.join(repoRoot, "examples/markdown/simple.md");
const templatePath = path.join(repoRoot, "examples/templates/simple.tsx");
function readJSON<T = any>(p: string): T { return JSON.parse(fs.readFileSync(p, "utf8")); }

function makeMockResend() {
  const calls = { create: 0, update: 0, send: 0, get: 0 };
  const last: any = {};
  const broadcasts = {
    async create(input: any) {
      calls.create++;
      last.create = input;
      return { data: { id: "br_test" }, error: null } as const;
    },
    async update(id: string, input: any) {
      calls.update++;
      last.update = { id, input };
      return { data: { id }, error: null } as const;
    },
    async send(id: string, input: any) {
      calls.send++;
      last.send = { id, input };
      return { data: { id: "send_test" }, error: null } as const;
    },
    async get(id: string) {
      calls.get++;
      last.get = { id };
      return { data: { id, status: "draft" }, error: null } as const;
    },
  };
  return { broadcasts, calls, last } as const;
}

function setEnv() {
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_key";
  process.env.RESEND_AUDIENCE_ID = "aud_123";
  process.env.RESEND_FROM = "from@example.com";
  delete process.env.DEFAULT_SUBJECT_PREFIX;
}

describe("examples-based flow", () => {
  it("creates a broadcast from examples/markdown/simple.md", async () => {
    setEnv();
    const mock = makeMockResend();
    const id = await createBroadcast(mock as any, mdPath);
    console.log("Created broadcast:", id);
    expect(id).toBe("br_test");
    expect(mock.calls.create).toBe(1);
    const storePath = path.join(
      path.dirname(mdPath),
      ".broadcasts",
      path.basename(mdPath) + ".broadcast.json",
    );
    expect(fs.existsSync(storePath)).toBe(true);
    const store = readJSON(storePath);
    console.log("Store:", store);
    expect(store.id).toBe("br_test");
  });

  it("renders with examples/templates/simple.tsx, checks Markdown slot, and mock-sends", async () => {
    setEnv();
    expect(fs.existsSync(templatePath)).toBe(true);
    expect(checkTemplate(templatePath)).toBe(true);
    const mock = makeMockResend();
    await sendWithOptionalTemplate(mock as any, mdPath, { template: templatePath });
    console.log("Template send calls:", mock.calls);
    expect(mock.calls.send).toBe(1);
  });

  it("renders plain HTML (no template) and mock-sends", async () => {
    setEnv();
    const mock = makeMockResend();
    await sendWithOptionalTemplate(mock as any, mdPath, {});
    console.log("Plain HTML send calls:", mock.calls);
    expect(mock.calls.send).toBe(1);
  });
});
