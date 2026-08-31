import assert from "node:assert/strict";

const BASE_URL = (process.env.SEO_BASE_URL ?? "http://127.0.0.1:43134").replace(/\/$/, "");
const LOCAL_CRON_SECRET = process.env.SEO_CRON_SECRET ?? "codex-local-http-verifier";
const LOCAL_ADMIN_TOKEN = process.env.SEO_ADMIN_TOKEN ?? "codex-local-admin-verifier";
const EXPECTED_ORIGIN = "https://campgogo.kr";
const configuredRequestTimeout = Number(process.env.SEO_HTTP_TIMEOUT_MS ?? "15000");
const REQUEST_TIMEOUT_MS = Number.isFinite(configuredRequestTimeout) && configuredRequestTimeout > 0
  ? configuredRequestTimeout
  : 15_000;
const AD_MARKERS = [
  'data-banner-site-key="campgogo"',
  'data-ad-client="ca-pub-3050601904412736"',
  "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
];

type Page = {
  body: string;
  contentType: string;
  headers: Headers;
  status: number;
};

let passed = 0;
const failures: string[] = [];

async function request(
  path: string,
  init?: RequestInit,
): Promise<Page> {
  const response = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...init,
  });

  return {
    body: await response.text(),
    contentType: response.headers.get("content-type") ?? "",
    headers: response.headers,
    status: response.status,
  };
}

async function check(name: string, assertion: () => Promise<void>): Promise<void> {
  try {
    await assertion();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${detail}`);
    console.error(`FAIL ${name}`);
  }
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function titleOf(html: string): string {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  assert.ok(match, "missing <title>");
  return match[1].replaceAll("&amp;", "&").trim();
}

function h1Count(html: string): number {
  return countMatches(html, /<h1\b/gi);
}

function brandCount(title: string): number {
  return countMatches(title, /캠핑고고/g);
}

function assertNoMonetization(html: string): void {
  for (const marker of AD_MARKERS) {
    assert.equal(html.includes(marker), false, `unexpected monetization marker: ${marker}`);
  }
}

function assertReaderMonetization(html: string): void {
  assert.ok(html.includes(AD_MARKERS[0]), "missing explicit Coupang reader marker");
  assert.ok(html.includes(AD_MARKERS[2]), "missing explicit AdSense loader");
}

function assertNoindex(html: string): void {
  const robotsTags = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*>/gi) ?? [];
  assert.ok(robotsTags.some((tag) => /content=["'][^"']*noindex/i.test(tag)), "missing robots noindex");
}

function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) =>
    match[1].replaceAll("&amp;", "&").trim(),
  );
}

async function main(): Promise<void> {
await check("home is a monetized reader page with one brand-owned title", async () => {
  const page = await request("/");
  assert.equal(page.status, 200);
  assert.match(page.contentType, /text\/html/);
  assert.equal(titleOf(page.body), "캠핑고고 — 예약 앱이 못 보여주는 야영지");
  assert.equal(brandCount(titleOf(page.body)), 1);
  assert.equal(h1Count(page.body), 1);
  assertReaderMonetization(page.body);
});

await check("privacy is canonical and ad-free", async () => {
  const page = await request("/privacy");
  assert.equal(page.status, 200);
  assert.equal(brandCount(titleOf(page.body)), 1);
  assert.match(page.body, /<link\s+rel=["']canonical["']\s+href=["']https:\/\/campgogo\.kr\/privacy["']/i);
  assert.equal(h1Count(page.body), 1);
  assertNoMonetization(page.body);
});

await check("admin uses a secure browser session, preserves filters, and stays ad-free", async () => {
  const page = await request("/admin/review");
  assert.equal(page.status, 404);
  assertNoindex(page.body);
  assert.equal(page.body.includes("YOUR_ADMIN_API_TOKEN"), false);
  assert.equal(page.body.includes("?token="), false);
  assertNoMonetization(page.body);

  const login = await request("/admin/login");
  assert.equal(login.status, 200);
  assertNoindex(login.body);
  assert.equal(h1Count(login.body), 1);
  assertNoMonetization(login.body);

  const invalidLogin = await request("/api/admin/session", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "token=wrong-token",
  });
  assert.equal(invalidLogin.status, 401);

  const sessionResponse = await request("/api/admin/session", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: LOCAL_ADMIN_TOKEN }).toString(),
  });
  assert.equal(sessionResponse.status, 303);
  const loginRedirect = new URL(sessionResponse.headers.get("location") ?? "", BASE_URL);
  const verificationBase = new URL(BASE_URL);
  assert.equal(loginRedirect.pathname, "/admin/review");
  assert.equal(loginRedirect.port, verificationBase.port);
  assert.ok(
    new Set([verificationBase.hostname, "127.0.0.1", "localhost"])
      .has(loginRedirect.hostname),
  );
  const setCookie = sessionResponse.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /^campgogo_admin_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\/admin/i);
  assert.equal(setCookie.includes(LOCAL_ADMIN_TOKEN), false);
  const sessionCookie = setCookie.split(";", 1)[0];

  const authorized = await request("/admin/review", {
    headers: { cookie: sessionCookie },
  });
  assert.equal(authorized.status, 200);
  assertNoindex(authorized.body);
  assert.equal(h1Count(authorized.body), 1);
  assert.equal(authorized.body.includes("?token="), false);
  assertNoMonetization(authorized.body);

  const filtered = await request("/admin/review?filter=all", {
    headers: { cookie: sessionCookie },
  });
  assert.equal(filtered.status, 200);
  assertNoindex(filtered.body);
  assertNoMonetization(filtered.body);
});

await check("unknown route uses the explicit 404 contract without ads", async () => {
  const page = await request("/codex-seo-missing-page-034");
  assert.equal(page.status, 404);
  assert.equal(titleOf(page.body), "페이지를 찾을 수 없습니다 | 캠핑고고");
  assertNoindex(page.body);
  assert.equal(h1Count(page.body), 1);
  assert.match(page.body, /페이지를 찾을 수 없습니다/);
  assertNoMonetization(page.body);
});

await check("streamed missing dynamic routes are noindex and ad-free", async () => {
  const paths = [
    "/blog/codex-seo-missing-post-034",
    "/캠핑장/서울/기타/codex-seo-missing-campsite-034",
    "/지역/codex-seo-missing-region-034",
    "/테마/codex-seo-missing-theme-034",
    "/시즌/13",
  ];

  for (const path of paths) {
    const page = await request(path);
    // Next.js streams dynamicParams=true routes, so a rendered notFound boundary
    // may retain HTTP 200. Preserve runtime publication while enforcing the
    // search-facing missing-page contract.
    assert.ok(page.status === 200 || page.status === 404, `${path}: ${page.status}`);
    console.log(`INFO ${path} -> ${page.status}`);
    assert.equal(titleOf(page.body), "페이지를 찾을 수 없습니다 | 캠핑고고", path);
    assertNoindex(page.body);
    assert.match(page.body, /페이지를 찾을 수 없습니다/, path);
    assert.equal(/<link\s+rel=["']canonical["']/i.test(page.body), false, path);
    assertNoMonetization(page.body);
  }
});

let firstBlogPath = "";
await check("root sitemap lists only the static and blog sitemap children", async () => {
  const page = await request("/sitemap.xml");
  assert.equal(page.status, 200);
  assert.match(page.contentType, /application\/xml/);
  assert.deepEqual(sitemapLocs(page.body), [
    `${EXPECTED_ORIGIN}/sitemap-static.xml`,
    `${EXPECTED_ORIGIN}/sitemap-blog.xml`,
  ]);
  assert.equal(page.body.includes("<lastmod>"), false);
});

await check("static sitemap has 17 honest fixed-lastmod entries", async () => {
  const page = await request("/sitemap-static.xml");
  assert.equal(page.status, 200);
  assert.equal(sitemapLocs(page.body).length, 17);
  const lastmods = [...page.body.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/g)].map((match) => match[1]);
  assert.equal(lastmods.length, 17);
  assert.ok(lastmods.every((value) => value === "2026-08-31"));
});

await check("campsite sitemap contains only valid published reader URLs", async () => {
  const page = await request("/sitemap-campsites.xml");
  assert.equal(page.status, 200);
  const locs = sitemapLocs(page.body);
  assert.equal(new Set(locs).size, locs.length, "duplicate campsite sitemap URL");
  const lastmods = [...page.body.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/g)].map((match) => match[1]);
  assert.equal(lastmods.length, locs.length);
  assert.ok(lastmods.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)));
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(lastmods.every((value) => value <= today), "future campsite sitemap lastmod");

  for (const loc of locs) {
    const url = new URL(loc);
    assert.equal(url.origin, EXPECTED_ORIGIN);
    assert.match(decodeURIComponent(url.pathname), /^\/캠핑장\/[^/]+\/[^/]+\/[^/]+$/);
    assert.equal(url.search, "");
    assert.equal(url.hash, "");
  }

  const sampleLocs = locs.length <= 10
    ? locs
    : [...locs.slice(0, 5), ...locs.slice(-5)];
  for (const loc of sampleLocs) {
    const url = new URL(loc);
    const reader = await request(`${url.pathname}${url.search}`);
    assert.equal(reader.status, 200, loc);
    assert.equal(/<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(reader.body), false, loc);
    assert.equal(h1Count(reader.body), 1, loc);
    assertReaderMonetization(reader.body);
  }
});

await check("blog sitemap exposes a real published reader URL", async () => {
  const page = await request("/sitemap-blog.xml");
  assert.equal(page.status, 200);
  const locs = sitemapLocs(page.body);
  assert.ok(locs.length > 0, "expected at least one published blog URL");
  const first = new URL(locs[0]);
  assert.equal(first.origin, EXPECTED_ORIGIN);
  assert.match(first.pathname, /^\/blog\//);
  firstBlogPath = first.pathname;
});

await check("published blog article is monetized and has one document brand", async () => {
  assert.ok(firstBlogPath, "blog sitemap did not provide a path");
  const page = await request(firstBlogPath);
  assert.equal(page.status, 200);
  assert.equal(brandCount(titleOf(page.body)), 1);
  assert.equal(h1Count(page.body), 1);
  assertReaderMonetization(page.body);
});

await check("GSC submission cannot run through GET or unconfirmed POST", async () => {
  const getPage = await request("/api/cron/gsc-submit");
  assert.equal(getPage.status, 405);

  const unauthorized = await request("/api/cron/gsc-submit", { method: "POST" });
  assert.equal(unauthorized.status, 401);

  const unconfirmed = await request("/api/cron/gsc-submit", {
    method: "POST",
    headers: { authorization: `Bearer ${LOCAL_CRON_SECRET}` },
  });
  assert.equal(unconfirmed.status, 428);
  assert.match(unconfirmed.body, /confirmation required/i);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} HTTP SEO contract(s) failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  throw new Error("HTTP SEO verification failed");
}

console.log(`\nHTTP SEO contracts passed: ${passed}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
