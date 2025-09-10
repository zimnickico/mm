import matter from "gray-matter";
import { marked } from "marked";
import * as path from "node:path";
import { readFileSync } from "node:fs";

export type Meta = {
  subject?: string;
  audienceId?: string;
  from?: string;
  scheduledAt?: string;
  [key: string]: unknown;
};

export type ParsedMarkdown = {
  html: string;
  text: string;
  subject: string;
  audienceId: string;
  from: string;
  scheduledAt?: string;
  meta: Meta;
};

export function parseMarkdownFile(file: string): ParsedMarkdown {
  const raw = readFileSync(file, "utf8");
  const { content, data } = matter(raw);
  const meta = data as Meta;

  const subjectBase = meta.subject ?? path.basename(file, path.extname(file));
  const prefix = process.env.DEFAULT_SUBJECT_PREFIX ?? "";
  const subject = `${prefix}${subjectBase}`.trim();
  const audienceId = meta.audienceId ?? process.env.RESEND_AUDIENCE_ID!;
  const from = meta.from ?? process.env.RESEND_FROM!;
  const scheduledAt = meta.scheduledAt;

  const html = String(marked.parse(content));
  const text = content;

  return { html, text, subject, audienceId, from, scheduledAt, meta };
}
