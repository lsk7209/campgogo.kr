import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { eq, sql } from "drizzle-orm";
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

  let updated = 0;
  let missing = 0;

  for (const file of files) {
    const draft = JSON.parse(await readFile(join(DRAFTS_DIR, file), "utf-8")) as BlogDraft;
    const publishAt = new Date(draft.scheduledAt);
    const result = await db
      .update(blogPosts)
      .set({
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
        dateModified: new Date().toISOString().slice(0, 10),
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(blogPosts.slug, draft.slug));

    if (result.rowsAffected === 0) {
      missing++;
      console.log(`missing ${draft.publishOrder}: ${draft.slug}`);
    } else {
      updated++;
      console.log(`updated ${draft.publishOrder}: ${draft.slug} @ ${draft.scheduledAt}`);
    }
  }

  console.log(`done: updated=${updated}, missing=${missing}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
