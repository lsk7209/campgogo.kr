/**
 * 블로그 초안 파일을 DB에 일괄 삽입하는 스크립트
 * 사용: npx tsx src/scripts/insert-blog-batch.ts
 *
 * blog-drafts/*.json 파일을 읽어 blogPosts 테이블에 INSERT (slug 충돌 시 skip)
 * publishedAt 날짜는 각 JSON의 publishOrder 필드 기준으로 자동 계산
 * 시작: 2026-06-05 09:00 KST, 5시간 간격
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

const DRAFTS_DIR = join(process.cwd(), "blog-drafts");
const START_DATE = new Date("2026-06-05T00:00:00Z"); // 09:00 KST = 00:00 UTC

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
  publishOrder: number; // 1-100
  tags?: string[];
}

function getPublishDate(order: number): Date {
  const d = new Date(START_DATE);
  d.setHours(d.getHours() + (order - 1) * 5);
  return d;
}

function getDatePublished(order: number): string {
  const d = getPublishDate(order);
  return d.toISOString().slice(0, 10);
}

async function main() {
  let files: string[];
  try {
    files = (await readdir(DRAFTS_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    console.error(`blog-drafts 디렉토리를 읽을 수 없습니다: ${DRAFTS_DIR}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("삽입할 파일이 없습니다.");
    process.exit(0);
  }

  console.log(`총 ${files.length}개 파일 처리 시작...`);
  let inserted = 0;
  let skipped = 0;

  for (const file of files.sort()) {
    const raw = await readFile(join(DRAFTS_DIR, file), "utf-8");
    const draft: BlogDraft = JSON.parse(raw);
    const publishAt = getPublishDate(draft.publishOrder);

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
        datePublished: getDatePublished(draft.publishOrder),
        dateModified: getDatePublished(draft.publishOrder),
      });
      inserted++;
      console.log(`✓ [${draft.publishOrder}/100] ${draft.slug}`);
    } catch {
      skipped++;
      console.log(`- skip (중복): ${draft.slug}`);
    }
  }

  console.log(`\n완료: ${inserted}개 삽입, ${skipped}개 건너뜀`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
