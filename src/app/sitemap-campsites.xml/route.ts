import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { cleanSitemapLoc, siteUrl } from "@/lib/seo/site-url";
import { eq } from "drizzle-orm";

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

export async function GET(): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];

  try {
    const publicCampsites = await db
      .select({
        id: campsites.id,
        sido: campsites.sido,
        gungu: campsites.gungu,
        updatedAt: campsites.updatedAt,
      })
      .from(campsites)
      .where(eq(campsites.isPublic, true));

    for (const c of publicCampsites) {
      const lastmod = c.updatedAt
        ? c.updatedAt.toISOString().slice(0, 10)
        : today;
      const path = `/캠핑장/${encodeURIComponent(c.sido)}/${encodeURIComponent(c.gungu ?? "")}/${encodeURIComponent(c.id)}`;
      entries.push(urlEntry(siteUrl(path), lastmod));
    }
  } catch {
    /* DB 없을 시 빈 sitemap 반환 */
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
