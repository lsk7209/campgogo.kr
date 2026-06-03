import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET ?? ""}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const candidates = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.status, "quality_passed"), isNull(pages.publishedAt)))
      .limit(10);

    if (candidates.length === 0) return Response.json({ published: 0, ids: [] });

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const ids: string[] = [];

    for (const { id } of candidates) {
      await db.update(pages)
        .set({ status: "published", publishedAt: now, datePublished: todayIso, updatedAt: now })
        .where(eq(pages.id, id));
      ids.push(id);
    }
    return Response.json({ published: ids.length, ids });
  } catch (err) {
    console.error("Cron publish error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
