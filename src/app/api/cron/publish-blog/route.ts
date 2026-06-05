import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getGscAccessToken, hasGscCredentials } from "@/lib/gsc/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE = "campgogo.kr";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const SITE_URL = process.env.SITE_URL ?? "https://campgogo.kr";
const GSC_SITE = encodeURIComponent(`https://${SITE}/`);

async function submitIndexNow(urls: string[]) {
  if (urls.length === 0) return { ok: true, count: 0 };
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    return { ok: res.ok, status: res.status, count: urls.length };
  } catch (err) {
    return { ok: false, error: String(err), count: 0 };
  }
}

async function pingGscSitemap() {
  if (!hasGscCredentials()) return;
  try {
    const token = await getGscAccessToken();
    const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap.xml`);
    await fetch(`https://www.googleapis.com/webmasters/v3/sites/${GSC_SITE}/sitemaps/${sitemapUrl}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch { /* GSC 실패는 무시 */ }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // 최근 6시간 내 공개된 글 (cron 5시간 주기 + 1시간 여유)
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  try {
    const newPosts = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          lte(blogPosts.publishedAt, now),
          gte(blogPosts.publishedAt, sixHoursAgo)
        )
      );

    if (newPosts.length === 0) {
      return Response.json({ submitted: 0, message: "새로 공개된 글 없음" });
    }

    const urls = newPosts.map((p) => `${SITE_URL}/blog/${p.slug}`);
    const result = await submitIndexNow(urls);
    await pingGscSitemap();

    return Response.json({
      submitted: result.count,
      indexNow: result,
      slugs: newPosts.map((p) => p.slug),
    });
  } catch (err) {
    console.error("publish-blog cron error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
