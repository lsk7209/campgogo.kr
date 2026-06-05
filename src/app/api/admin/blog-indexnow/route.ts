import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { and, eq, lte } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE = "campgogo.kr";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campgogo.kr";
const BATCH_SIZE = 500;

async function submitBatch(urls: string[]): Promise<{ ok: boolean; status?: number }> {
  if (!INDEXNOW_KEY) return { ok: false };
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
  return { ok: res.ok, status: res.status };
}

export async function GET(req: Request) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  const authHeader = req.headers.get("authorization");

  // URL query token 제거 — Authorization header만 허용 (로그 노출 방지)
  if (!adminToken || !authHeader || authHeader !== `Bearer ${adminToken}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!INDEXNOW_KEY) {
    return Response.json({ error: "INDEXNOW_KEY 환경변수 미설정" }, { status: 500 });
  }

  try {
    const now = new Date();
    const livePosts = await db
      .select({ slug: blogPosts.slug, datePublished: blogPosts.datePublished })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          lte(blogPosts.publishedAt, now)
        )
      );

    if (livePosts.length === 0) {
      return Response.json({ submitted: 0, message: "공개 글 없음" });
    }

    const urls = livePosts.map((p) => `${SITE_URL}/blog/${p.slug}`);

    const results: { batch: number; ok: boolean; status?: number }[] = [];
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const result = await submitBatch(batch);
      results.push({ batch: Math.floor(i / BATCH_SIZE) + 1, ...result });
    }

    const allOk = results.every((r) => r.ok);

    return Response.json({
      submitted: livePosts.length,
      batches: results.length,
      allOk,
      results,
      sampleUrls: urls.slice(0, 5),
    });
  } catch (err) {
    console.error("blog-indexnow error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
