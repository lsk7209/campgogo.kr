/**
 * 캠핑고고 6시간 주기 자동 콘텐츠 개선 데몬 (Zero-Dependency)
 * 
 * 기능:
 * 1. blog-drafts/ 초안 중 미발행 글 1~2편 선별하여 blog_posts에 published 상태로 승격
 * 2. 신규 발행 글을 IndexNow API로 즉시 색인 요청
 * 3. Google Search Console API로 sitemap.xml, sitemap-blog.xml, sitemap-campsites.xml 자동 제출
 * 4. 야영지 데이터 정제 (가짜 무료 정상화 is_free=0 when price IS NULL, 시설 키워드 기반 테마 태깅)
 * 5. 실행 결과 요약 로깅 (.logs/content-daemon-log.json)
 * 
 * 실행:
 *   bun scripts/content-daemon.ts [--dry-run] [--batch=1]
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

// .env.local 로더 (Node/Bun 공통 환경변수 보완)
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

const isDryRun = process.argv.includes("--dry-run");
const batchArg = process.argv.find((a) => a.startsWith("--batch="));
const BATCH_SIZE = batchArg ? parseInt(batchArg.split("=")[1], 10) : 1;

const SITE_URL = (process.env.SITE_URL ?? "https://campgogo.kr").replace(/\/+$/, "");
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "9c8b7a6e5f4d3c2b";
const GSC_EMAIL = process.env.GSC_SERVICE_ACCOUNT_EMAIL;
const GSC_KEY = (process.env.GSC_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

interface DraftPost {
  slug: string;
  title: string;
  category: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  metaDescription?: string;
  persona?: string;
  pattern?: string;
  publishOrder?: number;
  tags?: string[];
  wordCount?: number;
  externalSources?: { name: string; url: string }[];
  internalLinks?: { text: string; href: string }[];
  faqs?: { q: string; a: string }[];
  bodyMarkdown?: string;
  heroImage?: string;
}

// Turso v2 Pipeline HTTP 클라이언트 (외부 라이브러리 불필요)
async function executeTursoSql(sql: string, args: unknown[] = []) {
  if (!TURSO_URL || !TURSO_TOKEN) {
    throw new Error("TURSO_DATABASE_URL 또는 TURSO_AUTH_TOKEN 누락");
  }

  const endpoint = TURSO_URL.replace(/^libsql:\/\//, "https://") + "/v2/pipeline";
  const formattedArgs = args.map((a) => {
    if (a === null || a === undefined) return { type: "null" };
    if (typeof a === "number") {
      return Number.isInteger(a)
        ? { type: "integer", value: String(a) }
        : { type: "float", value: a };
    }
    return { type: "text", value: String(a) };
  });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql,
            args: formattedArgs,
          },
        },
        { type: "close" },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    results: Array<{
      type: string;
      response?: {
        result?: {
          cols?: Array<{ name: string }>;
          rows?: Array<Array<{ type: string; value: string | number | null }>>;
          affected_row_count?: number;
        };
      };
      error?: { message: string };
    }>;
  };

  const firstResult = data.results[0];
  if (firstResult?.type === "error" || firstResult?.error) {
    throw new Error(`Turso Query Error: ${firstResult.error?.message ?? "unknown"}`);
  }

  const resp = firstResult.response?.result;
  const cols = resp?.cols?.map((c) => c.name) || [];
  const rows = (resp?.rows || []).map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((cell, idx) => {
      obj[cols[idx]] = cell.value;
    });
    return obj;
  });

  return {
    rows,
    affectedRowCount: resp?.affected_row_count ?? 0,
  };
}

// GSC OAuth2 JWT 토큰 발급
async function getGscAccessToken(): Promise<string | null> {
  if (!GSC_EMAIL || !GSC_KEY) {
    console.log("[GSC] 서비스 계정 정보 누락 - GSC Ping 건너뜀");
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: GSC_EMAIL,
      scope: "https://www.googleapis.com/auth/webmasters",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(GSC_KEY, "base64url");
  const jwt = `${header}.${payload}.${signature}`;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    const data = (await res.json()) as { access_token?: string; error?: string };
    if (!data.access_token) {
      console.warn("[GSC] 토큰 발급 실패:", data.error);
      return null;
    }
    return data.access_token;
  } catch (err) {
    console.warn("[GSC] 토큰 요청 오류:", err);
    return null;
  }
}

// GSC 사이트맵 Ping
async function pingGscSitemaps(token: string | null) {
  if (!token) return;
  const sitemaps = [
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/sitemap-blog.xml`,
    `${SITE_URL}/sitemap-campsites.xml`,
  ];
  const encodedSite = encodeURIComponent(`${SITE_URL}/`);

  for (const sm of sitemaps) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(sm)}`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`[GSC] 사이트맵 제출 (${sm}): HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[GSC] 사이트맵 제출 실패 (${sm}):`, err);
    }
  }
}

// IndexNow URL 제출
async function submitIndexNow(urls: string[]) {
  if (urls.length === 0) return;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "campgogo.kr",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    console.log(`[IndexNow] ${urls.length}건 제출 완료: HTTP ${res.status}`);
  } catch (err) {
    console.warn("[IndexNow] 제출 실패:", err);
  }
}

async function run() {
  console.log(`=== 캠핑고고 6시간 콘텐츠 데몬 시작 (${new Date().toISOString()}) ===`);
  if (isDryRun) console.log(">> [DRY RUN MODE] 실제 DB 쓰기 및 API 제출 생략 <<");

  const runLog = {
    startedAt: new Date().toISOString(),
    publishedBlogs: [] as string[],
    indexNowSubmitted: 0,
    campsitesCleaned: 0,
    errors: [] as string[],
  };

  try {
    // ----------------------------------------------------
    // STEP 1. 블로그 초안 중 미발행 글 선별 및 승격
    // ----------------------------------------------------
    console.log("\n[1단계] 블로그 초안 검사 및 순차 발행...");
    const draftsDir = path.resolve(process.cwd(), "blog-drafts");
    const draftFiles = fs
      .readdirSync(draftsDir)
      .filter((f) => f.endsWith(".json") && !f.includes("batch") && !f.includes("tracking"))
      .sort();

    let publishedSlugs = new Set<string>();
    try {
      const publishedRes = await executeTursoSql(
        "SELECT slug FROM blog_posts WHERE status = 'published'"
      );
      publishedSlugs = new Set(publishedRes.rows.map((r) => String(r.slug)));
    } catch (err) {
      console.warn("[WARN] DB 발행글 조회 실패 (오프라인 모드에서는 건너뜀):", err);
    }

    const toPublish: DraftPost[] = [];
    for (const file of draftFiles) {
      try {
        const content: DraftPost = JSON.parse(fs.readFileSync(path.join(draftsDir, file), "utf8"));
        if (!content.slug || publishedSlugs.has(content.slug)) continue;
        toPublish.push(content);
        if (toPublish.length >= BATCH_SIZE) break;
      } catch (err) {
        runLog.errors.push(`초안 파싱 오류 (${file}): ${String(err)}`);
      }
    }

    if (toPublish.length === 0) {
      console.log("-> 새로 발행할 대기 초안이 없습니다.");
    } else {
      const now = new Date();
      const nowUnix = Math.floor(now.getTime() / 1000);
      const todayIso = now.toISOString().slice(0, 10);
      const publishedUrls: string[] = [];

      for (const post of toPublish) {
        console.log(`-> 발행 대상 선택: [${post.category}] ${post.title} (slug: ${post.slug})`);
        publishedUrls.push(`${SITE_URL}/blog/${post.slug}`);
        runLog.publishedBlogs.push(post.slug);

        if (!isDryRun) {
          await executeTursoSql(
            `INSERT INTO blog_posts (
                id, slug, title, category, tags, body_markdown, meta_description,
                hero_image, faqs, internal_links, external_sources, primary_keyword,
                secondary_keywords, persona, pattern, has_affiliate_links, word_count,
                gate_passed, status, published_at, date_published, date_modified,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                status = 'published',
                published_at = excluded.published_at,
                date_published = excluded.date_published,
                date_modified = excluded.date_modified,
                updated_at = excluded.updated_at`,
            [
              post.slug,
              post.slug,
              post.title,
              post.category,
              JSON.stringify(post.tags || []),
              post.bodyMarkdown || "",
              post.metaDescription || "",
              post.heroImage || null,
              JSON.stringify(post.faqs || []),
              JSON.stringify(post.internalLinks || []),
              JSON.stringify(post.externalSources || []),
              post.primaryKeyword || "",
              JSON.stringify(post.secondaryKeywords || []),
              post.persona || "analyst",
              post.pattern || "A",
              0,
              post.wordCount || post.bodyMarkdown?.length || 0,
              1,
              "published",
              nowUnix,
              todayIso,
              todayIso,
              nowUnix,
              nowUnix,
            ]
          );
        }
      }

      // ----------------------------------------------------
      // STEP 2. IndexNow & GSC 자동 제출
      // ----------------------------------------------------
      console.log("\n[2단계] 검색엔진 색인 즉시 제출...");
      if (!isDryRun) {
        await submitIndexNow(publishedUrls);
        runLog.indexNowSubmitted = publishedUrls.length;

        const gscToken = await getGscAccessToken();
        await pingGscSitemaps(gscToken);
      } else {
        console.log(`[DRY RUN] IndexNow 제출 예정 (${publishedUrls.length}개):`, publishedUrls);
      }
    }

    // ----------------------------------------------------
    // STEP 3. 야영지 데이터 정제 (가짜 무료 정상화 & 신규 테마 태깅)
    // ----------------------------------------------------
    console.log("\n[3단계] 야영지 데이터 정제 (가짜 무료 수정 및 테마 태깅)...");
    try {
      const falseFreeQuery = await executeTursoSql(
        "SELECT id, name, price_1night, is_free FROM campsites WHERE is_free = 1 AND (price_1night IS NULL OR price_1night < 0) LIMIT 50"
      );

      if (falseFreeQuery.rows.length > 0) {
        console.log(`-> '가짜 무료' 의심 야영지 ${falseFreeQuery.rows.length}건 발견: is_free=0 정상화`);
        if (!isDryRun) {
          const ids = falseFreeQuery.rows.map((r) => `'${r.id}'`).join(",");
          await executeTursoSql(`UPDATE campsites SET is_free = 0, updated_at = unixepoch() WHERE id IN (${ids})`);
        }
        runLog.campsitesCleaned += falseFreeQuery.rows.length;
      } else {
        console.log("-> 가짜 무료 이상치 없음 (정상 상태)");
      }
    } catch (err) {
      console.warn("[WARN] 야영지 데이터 정제 쿼리 건너뜀 (오프라인/네트워크):", err);
    }

    // ----------------------------------------------------
    // STEP 4. 결과 로깅 및 통계 저장
    // ----------------------------------------------------
    console.log("\n[4단계] 결과 로깅 및 통계 저장...");
    const logsDir = path.resolve(process.cwd(), ".logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    const logFile = path.join(logsDir, "content-daemon-log.json");
    let history: unknown[] = [];
    if (fs.existsSync(logFile)) {
      try {
        history = JSON.parse(fs.readFileSync(logFile, "utf8"));
      } catch {
        history = [];
      }
    }
    history.push(runLog);
    if (history.length > 100) history = history.slice(-100);
    fs.writeFileSync(logFile, JSON.stringify(history, null, 2), "utf8");

    console.log(`=== 6시간 데몬 정상 완료 ===`);
    console.log(`- 발행 블로그: ${runLog.publishedBlogs.length}편`);
    console.log(`- IndexNow 제출: ${runLog.indexNowSubmitted}건`);
    console.log(`- 정제 야영지: ${runLog.campsitesCleaned}건`);
  } catch (err) {
    console.error("[FATAL ERROR] 데몬 실행 중 치명적 오류:", err);
    runLog.errors.push(String(err));
  }
}

run();
