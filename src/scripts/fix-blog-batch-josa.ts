import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const DRAFTS_DIR = join(process.cwd(), "blog-drafts");
const FIRST_ORDER = 286;
const LAST_ORDER = 385;

type Draft = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  bodyMarkdown: string;
  metaDescription: string;
  excerpt?: string;
  cta?: string;
  faqs?: Array<{ q: string; a: string }>;
  wordCount: number;
};

function hasBatchim(value: string): boolean {
  const char = [...value.trim()].reverse().find((item) => /[가-힣]/.test(item));
  if (!char) return false;
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

function endsWithRieul(value: string): boolean {
  const char = [...value.trim()].reverse().find((item) => /[가-힣]/.test(item));
  if (!char) return false;
  const code = char.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 === 8;
}

function josa(keyword: string, pair: "eul" | "eun" | "i" | "gwa" | "ro"): string {
  const batchim = hasBatchim(keyword);
  switch (pair) {
    case "eul": return batchim ? "을" : "를";
    case "eun": return batchim ? "은" : "는";
    case "i": return batchim ? "이" : "가";
    case "gwa": return batchim ? "과" : "와";
    case "ro": return batchim && !endsWithRieul(keyword) ? "으로" : "로";
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fixText(value: string, keywords: string[]): string {
  let next = value;
  for (const keyword of keywords.sort((a, b) => b.length - a.length)) {
    const escaped = escapeRegExp(keyword);
    next = next
      .replace(new RegExp(`${escaped}(을|를)`, "g"), `${keyword}${josa(keyword, "eul")}`)
      .replace(new RegExp(`${escaped}(은|는)`, "g"), `${keyword}${josa(keyword, "eun")}`)
      .replace(new RegExp(`${escaped}(이|가)`, "g"), `${keyword}${josa(keyword, "i")}`)
      .replace(new RegExp(`${escaped}(과|와)`, "g"), `${keyword}${josa(keyword, "gwa")}`)
      .replace(new RegExp(`${escaped}(으로|로)`, "g"), `${keyword}${josa(keyword, "ro")}`);
  }
  return next;
}

function wordCount(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

async function main() {
  const files = (await readdir(DRAFTS_DIR))
    .filter((file) => /^\d{3}-.+\.json$/.test(file))
    .filter((file) => {
      const order = Number(file.slice(0, 3));
      return order >= FIRST_ORDER && order <= LAST_ORDER;
    })
    .sort();

  let changed = 0;
  for (const file of files) {
    const draftPath = join(DRAFTS_DIR, file);
    const draft = JSON.parse(await readFile(draftPath, "utf-8")) as Draft;
    const keywords = [draft.primaryKeyword, ...draft.secondaryKeywords].filter(Boolean);
    const before = JSON.stringify(draft);

    draft.bodyMarkdown = fixText(draft.bodyMarkdown, keywords);
    draft.metaDescription = fixText(draft.metaDescription, keywords);
    if (draft.excerpt) draft.excerpt = fixText(draft.excerpt, keywords);
    if (draft.cta) draft.cta = fixText(draft.cta, keywords);
    if (draft.faqs) {
      draft.faqs = draft.faqs.map((faq) => ({
        q: fixText(faq.q, keywords),
        a: fixText(faq.a, keywords),
      }));
    }
    draft.wordCount = wordCount(draft.bodyMarkdown);

    if (before !== JSON.stringify(draft)) changed++;
    await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`, "utf-8");
  }

  console.log(`josa fixed in ${changed} drafts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
