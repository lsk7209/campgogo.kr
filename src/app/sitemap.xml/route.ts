import { db } from "@/lib/db/client";
import { campsites, blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campgogo.kr";

const STATIC_PAGES = [
  "/", "/blog", "/about", "/authors", "/editorial-policy",
  "/data-license", "/disclosure", "/cookies", "/privacy", "/terms", "/contact",
];

const today = new Date().toISOString().split("T")[0];

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

export async function GET(): Promise<Response> {
  const staticEntries = STATIC_PAGES.map((path) =>
    urlEntry(
      `${SITE_URL}${path}`,
      today,
      path === "/" ? "daily" : "weekly",
      path === "/" ? "1.0" : "0.8"
    )
  );

  let campsiteEntries: string[] = [];
  let blogEntries: string[] = [];

  try {
    const publishedCampsites = await db
      .select({ id: campsites.id, sido: campsites.sido, gungu: campsites.gungu, updatedAt: campsites.updatedAt })
      .from(campsites)
      .limit(1000);

    campsiteEntries = publishedCampsites.map((c) => {
      const lastmod = c.updatedAt ? c.updatedAt.toISOString().split("T")[0] : today;
      const sido = encodeURIComponent(c.sido);
      const gungu = encodeURIComponent(c.gungu ?? "기타");
      return urlEntry(`${SITE_URL}/캠핑장/${sido}/${gungu}/${c.id}`, lastmod, "weekly", "0.7");
    });

    const publishedPosts = await db
      .select({ slug: blogPosts.slug, dateModified: blogPosts.dateModified, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));

    blogEntries = publishedPosts.map((p) => {
      const lastmod = p.dateModified ?? (p.updatedAt ? p.updatedAt.toISOString().split("T")[0] : today);
      return urlEntry(`${SITE_URL}/blog/${p.slug}`, lastmod, "weekly", "0.7");
    });
  } catch {
    // DB 실패 시 정적 페이지만
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...staticEntries, ...campsiteEntries, ...blogEntries],
    "</urlset>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
