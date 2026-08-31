import { db } from "@/lib/db/client";
import { campsites, pages } from "@/lib/db/schema";
import { cleanSitemapLoc, siteUrl } from "@/lib/seo/site-url";
import { and, eq, isNotNull, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function esc(s: string) {
  return cleanSitemapLoc(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function urlEntry(loc: string, lastmod: string) {
  return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
}

function publishedUrl(value: string): string | null {
  try {
    const base = new URL(siteUrl());
    const candidate = new URL(cleanSitemapLoc(value), base);
    if (candidate.origin !== base.origin) return null;
    if (!candidate.pathname.startsWith("/캠핑장/")) return null;
    if (candidate.search || candidate.hash) return null;
    return candidate.toString();
  } catch {
    return null;
  }
}

export async function GET(): Promise<Response> {
  const entries: string[] = [];

  try {
    const publishedPages = await db
      .select({
        url: pages.url,
        dateModified: pages.dateModified,
        datePublished: pages.datePublished,
        publishedAt: pages.publishedAt,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .innerJoin(campsites, eq(pages.campsiteId, campsites.id))
      .where(and(
        eq(pages.status, "published"),
        isNotNull(pages.campsiteId),
        isNotNull(pages.publishedAt),
        lte(pages.publishedAt, new Date()),
      ));

    for (const page of publishedPages) {
      const loc = publishedUrl(page.url);
      if (!loc || !page.publishedAt) continue;
      const lastmod = page.dateModified
        ?? page.datePublished
        ?? page.updatedAt?.toISOString().slice(0, 10)
        ?? page.publishedAt.toISOString().slice(0, 10);
      entries.push(urlEntry(loc, lastmod));
    }
  } catch {
    /* DB를 확인할 수 없으면 미발행 URL을 추측하지 않고 빈 sitemap을 반환한다. */
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
