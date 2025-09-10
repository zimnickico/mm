import { Resend } from "resend";
import { parseMarkdownFile } from "../utils/parse";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { checkTemplate } from "../utils/template";
import { readStore, writeStore, updateStore } from "../utils/store";
import { green, red, reset } from "../utils/styles";

type Meta = {
  subject?: string;
  audienceId?: string;
  from?: string;
  scheduledAt?: string;
};

function hashContent(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function renderWithTemplate(
  md: string,
  markdown: string,
  subject: string,
  meta: Meta,
  templateArg?: string,
): Promise<string | null> {
  if (!templateArg) return null;

  const cwd = process.cwd();
  const tryPaths: string[] = [];
  const candidate = path.isAbsolute(templateArg)
    ? templateArg
    : path.resolve(cwd, templateArg);
  if (existsSync(candidate)) tryPaths.push(candidate);

  const baseDir = path.resolve(cwd, "mail-templates");
  const baseName = path.basename(templateArg);
  const stems = [path.join(baseDir, baseName)];
  const exts = [".tsx", ".ts", ".jsx", ".js"];
  for (const stem of stems) for (const ext of exts) tryPaths.push(stem + ext);

  const resolved = tryPaths.find((p) => existsSync(p));
  if (!resolved) {
    throw new Error(
      `${red}(Error)${reset} Template not found for "${templateArg}". Looked in: ${[
        ...new Set(tryPaths),
      ].join(", ")}. Omit -t/--template to send a plain email.`,
    );
  }
  if (/\.tsx$/i.test(resolved) && !checkTemplate(resolved)) {
    throw new Error(
      `${red}(Error)${reset} Template at ${resolved} does not include <Markdown>{markdown}</Markdown>. Please add it or omit -t/--template to send plain email.`,
    );
  }

  try {
    const mod = await import(pathToFileURL(resolved).href);
    const props = { markdown, subject, meta, file: md } as any;

    if (typeof (mod as any).render === "function") {
      const out = await (mod as any).render(props);
      if (typeof out === "string") return out;
    }

    if (typeof (mod as any).default === "function") {
      try {
        const React = await import("react");
        const { render } = await import("@react-email/render");
        const el = React.createElement((mod as any).default, props);
        return render(el);
      } catch (e) {
        throw new Error(
          `${red}(Error)${reset} Template successfully resolved at ${resolved}, but rendering is unavailable: ${(e as Error).message}. Add react and @react-email/render as dependencies or omit -t/--template to send plain email.`,
        );
      }
    }
  } catch (e) {
    throw e;
  }
  return null;
}

async function createOrUpdateWithHtml(
  resend: Resend,
  md: string,
  html: string,
  text: string,
  subject: string,
  audienceId: string,
  from: string,
  contentHash: string,
  shouldUpdate: boolean,
) {
  const existing = readStore(md);
  if (!existing?.id) {
    const { data, error } = await resend.broadcasts.create({
      audienceId,
      from,
      subject,
      html,
      text,
    });
    if (error) {
      console.error(`${red}(Error)${reset} `, error);
      process.exit(1);
    }
    const id = (data as any)?.id as string;
    writeStore(md, {
      id,
      status: "draft",
      createdAt: new Date().toISOString(),
      contentHash,
    });
    console.log(
      `${green}(Success)${reset} Created a new broadcast: ${id} for file ${md}.`,
    );
    return id;
  } else {
    if (!shouldUpdate) {
      return existing.id as string;
    }
    const { data, error } = await resend.broadcasts.update(existing.id, {
      audienceId,
      from,
      subject,
      html,
      text,
    });
    if (error) {
      console.error(`${red}(Error)${reset} `, error);
      process.exit(1);
    }
    writeStore(md, { contentHash, updatedAt: new Date().toISOString() });
    console.log(
      `${green}(Success)${reset} Updated broadcast: ${existing.id} for file ${md}.`,
    );
    return (data as any)?.id as string;
  }
}

export async function sendWithOptionalTemplate(
  resend: Resend,
  md: string,
  opts: { schedule?: string; template?: string },
) {
  const {
    html: defaultHtml,
    text,
    subject,
    audienceId,
    from,
    meta,
  } = parseMarkdownFile(md);

  let templatedHtml: string | null = null;
  if (opts.template) {
    try {
      templatedHtml = await renderWithTemplate(
        md,
        text,
        subject,
        meta,
        opts.template,
      );
      if (!templatedHtml) {
        console.error(
          `${red}(Error)${reset} Template "${opts.template}" did not produce HTML. Please fix the template or omit -t/--template to send plain email.`,
        );
        process.exit(1);
      }
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }
  }
  const html = templatedHtml ?? defaultHtml;
  const contentHash = hashContent(text);
  const existing = readStore(md);
  const shouldUpdate =
    !existing?.contentHash ||
    existing.contentHash !== contentHash ||
    !!templatedHtml;

  const id = await createOrUpdateWithHtml(
    resend,
    md,
    html,
    text,
    subject,
    audienceId,
    from,
    contentHash,
    shouldUpdate,
  );

  const when = opts.schedule;
  const { data, error } = await resend.broadcasts.send(
    id,
    when ? { scheduledAt: when } : {},
  );
  if (error) {
    console.error(`${red}(Error)${reset} `, error);
    process.exit(1);
  }

  updateStore(md, {
    id,
    status: when ? "scheduled" : "sending",
    lastSendId: data?.id,
    lastSendAt: new Date().toISOString(),
    scheduledAt: when ?? null,
    contentHash,
  });
  console.log(
    when
      ? `${green}(Success)${reset} Scheduled broadcast: ${id} for ${when}.`
      : `${green}(Success)${reset} Sent broadcast: ${id}.`,
  );
}
