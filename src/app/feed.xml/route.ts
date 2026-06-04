import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campgogo.kr";
const SITE_NAME = "캠핑고고";
const SITE_DESC = "예약 앱이 못 보여주는 공공·저렴·차박 야영지 가이드";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rfc822(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toUTCString();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

// DB에 published 포스트가 없을 때 사용할 시드 데이터
const SEED_POSTS = [
  {
    slug: "find-hidden-spots-with-public-data",
    title: "예약 앱에 안 나오는 차박 명소, 어떻게 찾을까 — 공공데이터 200% 활용법",
    metaDescription: "data.go.kr의 야영장 데이터셋과 지자체 공지를 교차 확인하면, 앱에는 없는 한적한 노지를 찾을 수 있습니다. 실제로 따라 할 수 있는 5단계 체크리스트로 정리했습니다.",
    category: "차박 가이드",
    datePublished: "2026-06-01",
  },
  {
    slug: "june-budget-spots-before-rain",
    title: "2026년 6월, 장마 전 마지막 주말 가성비 노지 12곳",
    metaDescription: "장마가 오기 전 6월 주말, 예산 부담 없이 다녀올 수 있는 노지·공공 야영지 12곳을 골랐습니다.",
    category: "시즌 추천",
    datePublished: "2026-05-30",
  },
];

export async function GET(): Promise<Response> {
  const now = new Date().toUTCString();

  type PostRow = {
    slug: string;
    title: string;
    metaDescription: string | null;
    category: string;
    datePublished: string | null;
    dateModified: string | null;
  };

  let posts: PostRow[] = [];
  try {
    posts = await db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        metaDescription: blogPosts.metaDescription,
        category: blogPosts.category,
        datePublished: blogPosts.datePublished,
        dateModified: blogPosts.dateModified,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(50);
  } catch { /* DB 없을 시 시드 사용 */ }

  const items = (posts.length > 0 ? posts : SEED_POSTS).map((p) => {
    const link = `${SITE}/blog/${p.slug}`;
    const pubDate = rfc822(p.datePublished ?? undefined);
    const desc2 = p.metaDescription ?? p.title;
    return [
      "    <item>",
      `      <title>${esc(p.title)}</title>`,
      `      <link>${esc(link)}</link>`,
      `      <guid isPermaLink="true">${esc(link)}</guid>`,
      `      <description>${esc(desc2)}</description>`,
      `      <category>${esc(p.category)}</category>`,
      `      <pubDate>${pubDate}</pubDate>`,
      "    </item>",
    ].join("\n");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${esc(SITE_NAME)}</title>`,
    `    <link>${SITE}</link>`,
    `    <description>${esc(SITE_DESC)}</description>`,
    "    <language>ko</language>",
    `    <lastBuildDate>${now}</lastBuildDate>`,
    `    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>`,
    `    <image>`,
    `      <url>${SITE}/favicon.ico</url>`,
    `      <title>${esc(SITE_NAME)}</title>`,
    `      <link>${SITE}</link>`,
    `    </image>`,
    ...items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
