import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";

const DRAFTS_DIR = join(process.cwd(), "blog-drafts");
const FIRST_ORDER = 286;
const LAST_ORDER = 385;

interface BlogDraft {
  slug: string;
  title: string;
  category: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaDescription: string;
  bodyMarkdown: string;
  faqs: Array<{ q: string; a: string }>;
  internalLinks: Array<{ text: string; href: string }>;
  externalSources: Array<{ name: string; url: string }>;
  persona: string;
  pattern: string;
  wordCount: number;
  publishOrder: number;
  scheduledAt: string;
  tags?: string[];
}

function datePublished(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

async function main() {
  const files = (await readdir(DRAFTS_DIR))
    .filter((file) => /^\d{3}-.+\.json$/.test(file))
    .filter((file) => {
      const order = Number(file.slice(0, 3));
      return order >= FIRST_ORDER && order <= LAST_ORDER;
    })
    .sort();

  if (files.length !== 100) {
    throw new Error(`Expected 100 draft files (${FIRST_ORDER}-${LAST_ORDER}), got ${files.length}`);
  }

  let inserted = 0;
  let skipped = 0;
  for (const file of files) {
    const draft = JSON.parse(await readFile(join(DRAFTS_DIR, file), "utf-8")) as BlogDraft;
    const publishAt = new Date(draft.scheduledAt);
    try {
      await db.insert(blogPosts).values({
        id: crypto.randomUUID(),
        slug: draft.slug,
        title: draft.title,
        category: draft.category,
        tags: draft.tags ?? [],
        bodyMarkdown: draft.bodyMarkdown,
        metaDescription: draft.metaDescription,
        primaryKeyword: draft.primaryKeyword,
        secondaryKeywords: draft.secondaryKeywords,
        persona: draft.persona,
        pattern: draft.pattern,
        faqs: draft.faqs,
        internalLinks: draft.internalLinks,
        externalSources: draft.externalSources,
        hasAffiliateLinks: false,
        wordCount: draft.wordCount,
        gatePassed: true,
        status: "published",
        publishedAt: publishAt,
        datePublished: datePublished(draft.scheduledAt),
        dateModified: datePublished(draft.scheduledAt),
      });
      inserted++;
      console.log(`inserted ${draft.publishOrder}: ${draft.slug} @ ${draft.scheduledAt}`);
    } catch (error) {
      skipped++;
      console.log(`skipped ${draft.publishOrder}: ${draft.slug} (${String(error)})`);
    }
  }

  console.log(`done: inserted=${inserted}, skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
