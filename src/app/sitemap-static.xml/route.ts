export const dynamic = "force-dynamic";
export const revalidate = 86400; // 하루 캐시 (정적 데이터)

const SITE = process.env.SITE_URL ?? "https://campgogo.kr";

const STATIC_PAGES = [
  { path: "/",                 freq: "daily",   pri: "1.0" },
  { path: "/캠핑장",            freq: "daily",   pri: "0.9" },
  { path: "/지역",              freq: "weekly",  pri: "0.8" },
  { path: "/match",            freq: "weekly",  pri: "0.9" },
  { path: "/지도",              freq: "weekly",  pri: "0.8" },
  { path: "/blog",             freq: "daily",   pri: "0.9" },
  { path: "/about",            freq: "monthly", pri: "0.5" },
  { path: "/authors",          freq: "monthly", pri: "0.5" },
  { path: "/editorial-policy", freq: "monthly", pri: "0.4" },
  { path: "/data-license",     freq: "monthly", pri: "0.4" },
  { path: "/disclosure",       freq: "monthly", pri: "0.4" },
  { path: "/contact",          freq: "monthly", pri: "0.4" },
  { path: "/privacy",          freq: "monthly", pri: "0.4" },
  { path: "/terms",            freq: "monthly", pri: "0.4" },
  { path: "/cookies",          freq: "monthly", pri: "0.4" },
];

const SIDOS = ["경기", "강원", "경북", "경남", "충남", "충북", "전남", "전북", "인천", "제주", "서울", "부산", "대구", "광주", "대전", "울산"];
const THEMES = ["차박", "공공", "무료", "가성비", "계곡", "산", "해안"];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, lastmod: string, freq: string, pri: string) {
  return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
}

export async function GET(): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];

  for (const { path, freq, pri } of STATIC_PAGES) {
    entries.push(urlEntry(`${SITE}${path}`, today, freq, pri));
  }

  for (const sido of SIDOS) {
    entries.push(urlEntry(`${SITE}/지역/${encodeURIComponent(sido)}`, today, "weekly", "0.7"));
  }

  entries.push(urlEntry(`${SITE}/테마`, today, "weekly", "0.7"));
  for (const theme of THEMES) {
    entries.push(urlEntry(`${SITE}/테마/${encodeURIComponent(theme)}`, today, "weekly", "0.7"));
  }

  entries.push(urlEntry(`${SITE}/시즌`, today, "weekly", "0.6"));
  for (const m of MONTHS) {
    entries.push(urlEntry(`${SITE}/시즌/${m}`, today, "weekly", "0.6"));
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
