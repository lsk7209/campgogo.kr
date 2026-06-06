import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { cleanSitemapLoc, siteUrl } from "@/lib/seo/site-url";
import { and, eq, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function esc(s: string) {
  return cleanSitemapLoc(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, lastmod: string) {
  return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
}

export async function GET(): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];

  try {
    const posts = await db
      .select({ slug: blogPosts.slug, dateModified: blogPosts.dateModified, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date())));

    for (const p of posts) {
      const lastmod = p.dateModified ?? (p.updatedAt ? p.updatedAt.toISOString().slice(0, 10) : today);
      entries.push(urlEntry(siteUrl(`/blog/${p.slug}`), lastmod));
    }
  } catch { /* DB 없을 시 빈 sitemap 반환 */ }

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
