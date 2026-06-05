import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export const runtime = "nodejs";

const SITE = "campgogo.kr";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "";
const SITE_URL = process.env.SITE_URL ?? "https://campgogo.kr";

async function submitIndexNow(urls: string[]) {
  if (urls.length === 0) return;
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
  } catch {
    // IndexNow 실패는 무시 (비필수)
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidates = await db
      .select({ id: pages.id, url: pages.url })
      .from(pages)
      .where(and(eq(pages.status, "quality_passed"), isNull(pages.publishedAt)))
      .limit(10);

    if (candidates.length === 0) return Response.json({ published: 0, ids: [] });

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const ids: string[] = [];
    const publishedUrls: string[] = [];

    for (const { id, url } of candidates) {
      await db.update(pages)
        .set({ status: "published", publishedAt: now, datePublished: todayIso, updatedAt: now })
        .where(eq(pages.id, id));
      ids.push(id);
      if (url) {
        const fullUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;
        publishedUrls.push(fullUrl);
      }
    }

    // IndexNow 자동 전송 (Bing, Yandex 등)
    await submitIndexNow(publishedUrls);

    return Response.json({ published: ids.length, ids, indexNow: publishedUrls.length });
  } catch (err) {
    console.error("Cron publish error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
