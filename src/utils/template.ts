import { readFileSync } from "node:fs";

export function checkTemplate(path: string): boolean {
  try {
    const source = readFileSync(path, "utf8");
    const regexp =
      /<Markdown(?:\s[^>]*)?>[\s\S]*?\{\s*markdown\s*\}[\s\S]*?<\/Markdown>/m;
    return regexp.test(source);
  } catch {
    return false;
  }
}
