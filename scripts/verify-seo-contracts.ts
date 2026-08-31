import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildBlogMeta,
  buildCampsiteMeta,
  buildRegionMeta,
} from "../src/lib/seo/meta";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  isAdminAuthorized,
} from "../src/lib/admin-session";

const ROOT = process.cwd();
const failures: string[] = [];
let passed = 0;

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function check(name: string, assertion: () => void): void {
  try {
    assertion();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAIL ${name}`);
  }
}

check("metadata helpers leave the root template as the sole document-brand owner", () => {
  const blog = buildBlogMeta({ title: "여름 캠핑 준비", slug: "summer" });
  const campsite = buildCampsiteMeta({
    name: "테스트 야영지",
    sido: "강원",
    gungu: "춘천",
    slug: "test",
  });
  const region = buildRegionMeta("강원", 12, "춘천");

  assert.equal(blog.title, "여름 캠핑 준비");
  assert.equal(blog.openGraph?.title, "여름 캠핑 준비 | 캠핑고고");
  assert.equal(typeof campsite.title, "string");
  assert.doesNotMatch(campsite.title as string, /\| 캠핑고고$/);
  assert.match(String(campsite.openGraph?.title), /\| 캠핑고고$/);
  assert.match(String(campsite.twitter?.title), /\| 캠핑고고$/);
  assert.equal(region.title, "강원 춘천 야영지 12곳 모음");
  assert.equal(region.openGraph?.title, "강원 춘천 야영지 12곳 모음 | 캠핑고고");
});

check("editorial campsite titles stay aligned across document and social metadata", () => {
  const campsitePage = read("src/app/캠핑장/[sido]/[gungu]/[slug]/page.tsx");
  assert.match(campsitePage, /meta\.title = page\.title;/);
  assert.match(campsitePage, /meta\.openGraph[\s\S]*?\.title = `\$\{page\.title\} \| 캠핑고고`;/);
  assert.match(campsitePage, /meta\.twitter[\s\S]*?\.title = `\$\{page\.title\} \| 캠핑고고`;/);
});

check("home and blog document titles do not double-apply the root template", () => {
  const home = read("src/app/page.tsx");
  const blog = read("src/app/blog/page.tsx");
  const blogPost = read("src/app/blog/[slug]/page.tsx");
  const blogCategory = read("src/app/blog/category/[category]/page.tsx");

  assert.match(home, /title:\s*\{[\s\S]*?absolute:\s*"캠핑고고 — 예약 앱이 못 보여주는 야영지"[\s\S]*?\}/);
  assert.match(blog, /title:\s*"가이드 & 블로그"/);
  assert.doesNotMatch(blogPost, /title:\s*"블로그 \| 캠핑고고"/);
  assert.match(blogCategory, /const title = `\$\{decoded\} 블로그`;/);
  assert.match(blogCategory, /const socialTitle = `\$\{title\} \| 캠핑고고`;/);
});

check("global layout does not own monetization", () => {
  const layout = read("src/app/layout.tsx");
  assert.doesNotMatch(layout, /CoupangAffiliateBanner/);
  assert.doesNotMatch(layout, /adsbygoogle\.js/);
  assert.doesNotMatch(layout, /pagead2\.googlesyndication\.com/);
});

check("reader pages explicitly opt in to monetization after successful rendering", () => {
  const footer = read("src/components/site-footer.tsx");
  assert.match(footer, /showMonetization\s*=\s*false/);
  assert.match(footer, /CoupangAffiliateBanner/);
  assert.match(footer, /adsbygoogle\.js/);

  const readerPages = [
    "src/app/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/app/blog/category/[category]/page.tsx",
    "src/app/match/page.tsx",
    "src/app/지도/page.tsx",
    "src/app/지역/page.tsx",
    "src/app/지역/[sido]/page.tsx",
    "src/app/지역/[sido]/[gungu]/page.tsx",
    "src/app/테마/page.tsx",
    "src/app/테마/[theme]/page.tsx",
    "src/app/시즌/page.tsx",
    "src/app/시즌/[month]/page.tsx",
    "src/app/캠핑장/page.tsx",
    "src/app/캠핑장/[sido]/[gungu]/[slug]/page.tsx",
    "src/app/ko-campsite-index/page.tsx",
    "src/app/ko-jido/page.tsx",
    "src/app/ko-jiyeok/page.tsx",
    "src/app/ko-sijeun/page.tsx",
    "src/app/ko-tema/page.tsx",
  ];

  for (const file of readerPages) {
    assert.match(read(file), /<SiteFooter showMonetization \/>/, file);
  }
  assert.match(read("src/components/static-page-layout.tsx"), /<SiteFooter \/>/);
});

check("trust pages publish self-canonicals", () => {
  const canonicals: Record<string, string> = {
    "src/app/about/page.tsx": "https://campgogo.kr/about",
    "src/app/privacy/page.tsx": "https://campgogo.kr/privacy",
    "src/app/terms/page.tsx": "https://campgogo.kr/terms",
    "src/app/cookies/page.tsx": "https://campgogo.kr/cookies",
    "src/app/contact/page.tsx": "https://campgogo.kr/contact",
    "src/app/data-license/page.tsx": "https://campgogo.kr/data-license",
    "src/app/disclosure/page.tsx": "https://campgogo.kr/disclosure",
    "src/app/editorial-policy/page.tsx": "https://campgogo.kr/editorial-policy",
    "src/app/authors/page.tsx": "https://campgogo.kr/authors",
  };

  for (const [file, canonical] of Object.entries(canonicals)) {
    assert.ok(read(file).includes(`alternates: { canonical: "${canonical}" }`), file);
  }
});

check("campsite discovery is derived only from eligible published page rows", () => {
  const sitemap = read("src/app/sitemap-campsites.xml/route.ts");
  assert.match(sitemap, /import \{ campsites, pages \} from "@\/lib\/db\/schema"/);
  assert.match(sitemap, /\.from\(pages\)/);
  assert.match(sitemap, /\.innerJoin\(campsites, eq\(pages\.campsiteId, campsites\.id\)\)/);
  assert.match(sitemap, /eq\(pages\.status, "published"\)/);
  assert.match(sitemap, /isNotNull\(pages\.publishedAt\)/);
  assert.match(sitemap, /lte\(pages\.publishedAt, new Date\(\)\)/);
});

check("automatic GSC resubmission is removed and the endpoint fails closed", () => {
  const vercel = JSON.parse(read("vercel.json")) as { crons?: Array<{ path?: string }> };
  assert.equal(vercel.crons?.some((cron) => cron.path === "/api/cron/gsc-submit"), false);

  const route = read("src/app/api/cron/gsc-submit/route.ts");
  assert.match(route, /export async function POST\(req: Request\)/);
  assert.doesNotMatch(route, /export async function GET\(req: Request\)/);
  assert.match(route, /SUBMIT_CAMPGOGO_SITEMAP/);
  assert.match(route, /status:\s*428/);
});

check("completed bulk collection is manual-only", () => {
  const workflow = read(".github/workflows/bulk-collect.yml");
  assert.match(workflow, /^\s*workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^\s*schedule:/m);
  assert.match(workflow, /COLLECT_CAMPGOGO_BULK/);
  assert.match(workflow, /default:\s*true/);
  assert.match(workflow, /COLLECT_CONFIRMATION:\s*\$\{\{ inputs\.confirm \}\}/);
  assert.match(workflow, /"\$COLLECT_CONFIRMATION"/);
  assert.doesNotMatch(workflow, /if \[ "\$\{\{ inputs\./);
});

check("CI runs the SEO contracts with a deterministic local DB placeholder", () => {
  const workflow = read(".github/workflows/ci.yml");
  assert.match(workflow, /npm run test:seo/);
  assert.match(workflow, /TURSO_DATABASE_URL:\s*file:ci\.db/);
  assert.doesNotMatch(workflow, /placeholder\.turso\.io/);
});

check("admin review fails closed and is nonindexable", () => {
  const admin = read("src/app/admin/review/page.tsx");
  const login = read("src/app/admin/login/page.tsx");
  const session = read("src/app/api/admin/session/route.ts");
  assert.match(admin, /robots:\s*\{[\s\S]*?index:\s*false,\s*follow:\s*false/);
  assert.match(admin, /isAdminAuthorized\(\{/);
  assert.match(admin, /cookieStore\.get\(ADMIN_SESSION_COOKIE\)/);
  assert.match(admin, /if \(!isAuth\) notFound\(\);/);
  assert.doesNotMatch(admin, /process\.env\.ADMIN_API_TOKEN \?\? ""/);
  assert.doesNotMatch(admin, /sp\.token|\?token=/);
  assert.doesNotMatch(admin, /YOUR_ADMIN_API_TOKEN/);
  assert.match(login, /action="\/api\/admin\/session"/);
  assert.match(login, /type="password"/);
  assert.match(session, /httpOnly:\s*true/);
  assert.match(session, /secure:\s*true/);
  assert.match(session, /sameSite:\s*"strict"/);
  assert.match(session, /path:\s*"\/admin"/);
  assert.match(session, /status:\s*303/);
});

check("admin sessions enforce expiry and support global version revocation", () => {
  const nowMs = Date.UTC(2026, 7, 31, 6, 0, 0);
  const token = "contract-admin-token";
  const session = createAdminSession(token, "v1", nowMs);
  const authorize = (version: string, at: number) => isAdminAuthorized({
    adminToken: token,
    authorization: null,
    nowMs: at,
    session,
    version,
  });

  assert.equal(authorize("v1", nowMs), true);
  assert.equal(authorize("v2", nowMs), false);
  assert.equal(
    authorize("v1", nowMs + ADMIN_SESSION_MAX_AGE_SECONDS * 1_000 + 1),
    false,
  );
  assert.equal(session.includes(token), false);
});

check("campsite sitemap requires an existing, already-published page", () => {
  const sitemap = read("src/app/sitemap-campsites.xml/route.ts");
  assert.match(sitemap, /\.innerJoin\(campsites, eq\(pages\.campsiteId, campsites\.id\)\)/);
  assert.match(sitemap, /eq\(pages\.status, "published"\)/);
  assert.match(sitemap, /isNotNull\(pages\.publishedAt\)/);
  assert.match(sitemap, /lte\(pages\.publishedAt, new Date\(\)\)/);
});

check("HTTP verification has bounded requests and child-process cleanup", () => {
  const http = read("scripts/verify-seo-http.ts");
  const runner = read("scripts/run-seo-http-verification.ts");
  assert.match(http, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(runner, /AbortSignal\.timeout\(2_000\)/);
  assert.match(runner, /async function terminate\(/);
  assert.match(runner, /await terminate\(server, "Next verification server"\)/);
});

check("dynamic metadata rejects nonexistent entities before streaming", () => {
  const files = [
    "src/app/blog/[slug]/page.tsx",
    "src/app/캠핑장/[sido]/[gungu]/[slug]/page.tsx",
    "src/app/지역/[sido]/page.tsx",
    "src/app/지역/[sido]/[gungu]/page.tsx",
    "src/app/테마/[theme]/page.tsx",
    "src/app/시즌/[month]/page.tsx",
  ];

  for (const file of files) {
    const source = read(file);
    const metadataStart = source.indexOf("export async function generateMetadata");
    const pageStart = source.indexOf("export default", metadataStart);
    assert.ok(metadataStart >= 0 && pageStart > metadataStart, file);
    const metadata = source.slice(metadataStart, pageStart);
    assert.match(metadata, /notFound\(\)/, file);
  }
});

check("sitemap lastmod values do not pretend every request changed static content", () => {
  const sitemapIndex = read("src/app/sitemap.xml/route.ts");
  const staticSitemap = read("src/app/sitemap-static.xml/route.ts");
  assert.doesNotMatch(sitemapIndex, /<lastmod>/);
  assert.doesNotMatch(staticSitemap, /new Date\(\)/);
  assert.match(staticSitemap, /const STATIC_LASTMOD = "2026-08-31";/);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} SEO contract(s) failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\nSEO contracts passed: ${passed}`);
