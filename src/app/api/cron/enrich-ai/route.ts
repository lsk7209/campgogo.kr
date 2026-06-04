import { db } from "@/lib/db/client";
import { campsites, pages, aiBudget } from "@/lib/db/schema";
import { isNull, eq, and, notInArray, sql } from "drizzle-orm";
import { enrichCampsite, runQualityGates } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;

const BATCH = 5;          // 1회 cron 처리 수
const DAILY_BUDGET = 5.0; // 일 최대 $5
const COST_PER_CALL = 0.000375; // gemini-2.0-flash 1K token 기준 (approximate)

async function getTodaySpend(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const row = await db.select({ total: aiBudget.totalCostUsd })
    .from(aiBudget).where(eq(aiBudget.date, today)).get();
  return row?.total ?? 0;
}

async function addSpend(cost: number) {
  const today = new Date().toISOString().slice(0, 10);
  await db.insert(aiBudget).values({ date: today, totalCostUsd: cost, callCount: 1 })
    .onConflictDoUpdate({
      target: aiBudget.date,
      set: { totalCostUsd: sql`total_cost_usd + ${cost}`, callCount: sql`call_count + 1` },
    });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET ?? ""}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ skipped: true, reason: "GEMINI_API_KEY not set" });

  // 예산 체크
  const spent = await getTodaySpend();
  if (spent >= DAILY_BUDGET) {
    return Response.json({ skipped: true, reason: `일 예산 소진 ($${spent.toFixed(3)})` });
  }

  // 이미 pages 레코드가 있는 캠핑장 ID 목록
  const existingPageIds = await db
    .select({ campsiteId: pages.campsiteId })
    .from(pages)
    .where(eq(pages.type, "campsite"));
  const excludeIds = existingPageIds.map((r) => r.campsiteId).filter(Boolean) as string[];

  // 처리할 캠핑장 선택 (uniquePoints 없고, 위경도 있는 것 우선)
  const candidates = await db.select().from(campsites)
    .where(
      excludeIds.length > 0
        ? and(isNull(campsites.uniquePoints), notInArray(campsites.id, excludeIds))
        : isNull(campsites.uniquePoints)
    )
    .orderBy(campsites.fitScore)
    .limit(BATCH);

  if (candidates.length === 0) {
    return Response.json({ done: true, reason: "처리할 캠핑장 없음" });
  }

  const results: {
    id: string; name: string; status: "ok" | "failed" | "skipped";
    score?: number; gates?: string[]; error?: string;
  }[] = [];

  for (const c of candidates) {
    if (spent + results.length * COST_PER_CALL >= DAILY_BUDGET) {
      results.push({ id: c.id, name: c.name, status: "skipped" });
      continue;
    }

    try {
      const facilities = (c.facilities as Record<string, boolean> | null) ?? null;
      const enriched = await enrichCampsite(
        {
          id: c.id, name: c.name, sido: c.sido, gungu: c.gungu,
          address: c.address, operator: c.operator,
          isPublic: c.isPublic, isFree: c.isFree, isCheap: c.isCheap,
          isChabak: c.isChabak, type: c.type, facilities, price1Night: c.price1Night,
        },
        apiKey
      );

      const { gates, score, passed } = runQualityGates(enriched, c.isChabak);
      await addSpend(COST_PER_CALL);

      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const pageId = `p-${c.id}`;
      const slug = c.id;
      const url = `/캠핑장/${encodeURIComponent(c.sido)}/${encodeURIComponent(c.gungu ?? "기타")}/${c.id}`;

      // 캠핑장 uniquePoints 업데이트
      await db.update(campsites)
        .set({ uniquePoints: enriched.uniquePoints as unknown as null, updatedAt: now })
        .where(eq(campsites.id, c.id));

      // pages 레코드 생성
      await db.insert(pages).values({
        id: pageId,
        type: "campsite",
        slug,
        url,
        campsiteId: c.id,
        sido: c.sido,
        gungu: c.gungu,
        title: enriched.title,
        metaDescription: enriched.metaDescription,
        commentary: enriched.commentary,
        faqs: enriched.faqs as unknown as null,
        internalLinks: enriched.internalLinks as unknown as null,
        qualityScore: score,
        gatePassed: passed,
        gateResults: gates as unknown as null,
        uniquePointsCount: enriched.uniquePoints.length,
        status: passed ? "quality_passed" : "draft",
        persona: "analyst",
        authorLabel: "캠핑고고 편집팀",
        datePublished: passed ? todayIso : null,
        publishedAt: passed ? now : null,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: pages.id,
        set: {
          title: enriched.title,
          metaDescription: enriched.metaDescription,
          commentary: enriched.commentary,
          faqs: enriched.faqs as unknown as null,
          internalLinks: enriched.internalLinks as unknown as null,
          qualityScore: score,
          gatePassed: passed,
          gateResults: gates as unknown as null,
          uniquePointsCount: enriched.uniquePoints.length,
          status: passed ? "quality_passed" : "draft",
          datePublished: passed ? todayIso : null,
          publishedAt: passed ? now : null,
          updatedAt: now,
        },
      });

      results.push({
        id: c.id, name: c.name,
        status: "ok",
        score,
        gates: gates.filter((g) => !g.passed).map((g) => g.name),
      });

    } catch (err) {
      results.push({ id: c.id, name: c.name, status: "failed", error: String(err).slice(0, 100) });
    }

    // Gemini rate limit 방지
    await new Promise((r) => setTimeout(r, 500));
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return Response.json({ processed: results.length, ok, failed, results });
}
