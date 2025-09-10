import { Resend } from "resend";
import { parseMarkdownFile } from "../utils/parse";
import { writeStore } from "../utils/store";
import { green, red, reset } from "../utils/styles";

type Meta = {
  subject?: string;
  audienceId?: string;
  from?: string;
  scheduledAt?: string;
};

export async function createBroadcast(resend: Resend, md: string) {
  const { html, text, subject, audienceId, from } = parseMarkdownFile(md);

  const { data, error } = await resend.broadcasts.create({
    audienceId,
    from,
    subject,
    html,
    text,
  });
  if (error) {
    console.error(`${red}(Error)${reset}`, error);
    process.exit(1);
  }
  const id = (data as any)?.id as string;
  writeStore(md, {
    id,
    status: "draft",
    createdAt: new Date().toISOString(),
  });
  console.log(
    `${green}(Success)${reset} Created a new broadcast: ${id} for file ${md}.`,
  );
  return id;
}
