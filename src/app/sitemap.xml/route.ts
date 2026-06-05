export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SITE = process.env.SITE_URL ?? "https://campgogo.kr";

const SITEMAPS = [
  { loc: `${SITE}/sitemap-static.xml` },
  { loc: `${SITE}/sitemap-campsites.xml` },
  { loc: `${SITE}/sitemap-blog.xml` },
];

export async function GET(): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);

  const entries = SITEMAPS.map(
    (s) => `  <sitemap>\n    <loc>${s.loc}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</sitemapindex>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
