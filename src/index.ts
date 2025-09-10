#!/usr/bin/env bun

import "dotenv/config";
import { Command } from "commander";
import { Resend } from "resend";
import { verifyVariables } from "./utils/env";
import { createBroadcast as createCommand } from "./cmds/create";
import { status as statusCmd } from "./cmds/status";
import { sendWithOptionalTemplate } from "./cmds/send";

const program = new Command();

program
  .name("M(arkdown)M(ailer)")
  .description("Create and send broadcasts from markdown files.")
  .version("0.2.0");

program
  .command("create")
  .argument("<file>", ".md file")
  .description("Create, or re-create a broadcast from the your markdown file.")
  .action(async (file) => {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await createCommand(resend, file);
  });

program
  .command("send")
  .argument("<file>", "markdown file")
  .option("-s, --schedule <when>", 'e.g. "in 15 min" or "tomorrow 9am"')
  .option(
    "-t, --template <nameOrPath>",
    "template name or path from ./mail-templates",
  )
  .description("Send, or schedule the broadcast for the given file.")
  .action(async (file, opts) => {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await sendWithOptionalTemplate(resend, file, {
      schedule: opts.schedule,
      template: opts.template,
    });
  });

program
  .command("status")
  .argument("<file>", "markdown file")
  .description("Show local and remote info for the given file’s broadcast.")
  .action(async (file) => {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await statusCmd(resend, file);
  });

verifyVariables();
program.parseAsync(process.argv);
