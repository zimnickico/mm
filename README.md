# Markdown Mailer

![NPM Version](https://img.shields.io/npm/v/%40markdown-mailer%2Fcli)

Markdown Mailer is a simple tool allowing you to create newsletters from your markdown posts. It's powered by [Resend](https://resend.com/) and [React Email](https://react.email/) under the hood, but there are plans to support other senders in the future.

## Installation & Configuration

You can add Markdown Mailer as a dependency in your project, for example using [Bun.](https://bun.sh/)

```sh
bun add @markdown-mailer/cli
```

Before you start using it, I recommend adding the required enviorment variables to your `.env` file. If you're unsure where to find some of the below values, please refer to [Resend's Docs.](https://resend.com/docs/)

```
RESEND_API_KEY=
RESEND_AUDIENCE_ID=
RESEND_FROM=
```
After that's done, you're basically ready to start sending your posts as a newsletter.

## Usage

To create a new email draft from a file, all you need to do is run:

```sh
bunx @markdown-mailer/cli create <path/to/file.md>
```

This will also create a `.broadcasts` folder in the same directory as your file that will keep track of the entry's status.
I recommend adding that folder to your `.gitignore` file.

To send the draft you have created, you can run:

```sh
bunx @markdown-mailer/cli send <path/to/file.md>
```

This will also update the draft, even if you made changes to the file, so don't worry about recreating it.

That's the simplest way to get started, but there are a few features that are also very hadny to know about, so keep reading on.

## Templates

Sending plain emails is great and all, but sending emails rendered with your custom styling is even better. Markdown Mailer allows you to use [React Email](https://react.email/) templates to send fully styled and customizable emails. You can do so using the `-t/--template` flag.

```sh
bunx @markdown-mailer/cli send <path/to/file.md> -t <template-name>
```

It will, by default look for templates under `/mail-templates` in your projects root directory, but you can also pass `<path/to/template.tsx>` to specify the exact file to use instead.
Keep in mind, that all templates need to provide a valid export and include a `<Markdown/>` component from [React Email](https://react.email/).

Here's an [example template](https://github.com/zimnickico/markdown-mailer/tree/main/examples/templates) created for this.

## Scheduling

You can schedule posts to be sent in advance. In order to do so, pass the `-s/--schedule` flag alongside a time, date or duration described with natural language.

```sh
bunx @markdown-mailer/cli send <path/to/file.md> -t <template-name> -s <"in 5 minutes">
```

The example above will schedule the post to be sent in 5 minutes. You can also confirm this, by running:

```sh
bunx @markdown-mailer/cli status <path/to/file.md>
```

This will output the information about a given post, including for when it has been scheduled.

**Currently there is no way to delete a scheduled draft!**

## Frontmatter & Metadata

The information you input in the markdown file's frontmatter, can also be used to modify the post. For example, if you'd like to override the `audienceId` for a single post, you don't have to edit the enviorment variable, instead add:

```md
---
audienceId: <id>
---
```

at the beggining of you markdown file. You can do the same for the `from, subject, scheduledAt` values.

## Roadmap

Please know that this is a tiny tool that I have created primarly for myslef, to be able to send posts as newsletter entries from my [11ty](https://www.11ty.dev/) website. No support or new features are guaranteed. That said, the current roadmap looks something like this:

1. Allow for using senders other than Resend.
2. More template examples.
3. Improved template parsing.
4. Deleting drafts/cancel send.

## Contributing

The contributing guide is still work in progress.
