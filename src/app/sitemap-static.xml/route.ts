import { cleanSitemapLoc, siteUrl } from "@/lib/seo/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 86400;
const STATIC_LASTMOD = "2026-08-31";

const STATIC_PAGES = [
  { path: "/", freq: "daily", pri: "1.0" },
  { path: "/캠핑장", freq: "daily", pri: "0.9" },
  { path: "/지역", freq: "weekly", pri: "0.8" },
  { path: "/지도", freq: "weekly", pri: "0.8" },
  { path: "/테마", freq: "weekly", pri: "0.7" },
  { path: "/시즌", freq: "weekly", pri: "0.6" },
  { path: "/match", freq: "weekly", pri: "0.9" },
  { path: "/blog", freq: "daily", pri: "0.9" },
  { path: "/about", freq: "monthly", pri: "0.5" },
  { path: "/authors", freq: "monthly", pri: "0.5" },
  { path: "/editorial-policy", freq: "monthly", pri: "0.4" },
  { path: "/data-license", freq: "monthly", pri: "0.4" },
  { path: "/disclosure", freq: "monthly", pri: "0.4" },
  { path: "/contact", freq: "monthly", pri: "0.4" },
  { path: "/privacy", freq: "monthly", pri: "0.4" },
  { path: "/terms", freq: "monthly", pri: "0.4" },
  { path: "/cookies", freq: "monthly", pri: "0.4" },
];

function esc(s: string) {
  return cleanSitemapLoc(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, lastmod: string, freq: string, pri: string) {
  return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
}

export async function GET(): Promise<Response> {
  const entries: string[] = [];

  for (const { path, freq, pri } of STATIC_PAGES) {
    entries.push(urlEntry(siteUrl(path), STATIC_LASTMOD, freq, pri));
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
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
