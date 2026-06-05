import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { calcDistanceFromCities } from "@/lib/curation/distance";
import type { CampsiteMatchData } from "@/lib/matching/client-matcher";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 300;

function buildThemes(c: typeof campsites.$inferSelect): string[] {
  const themes: string[] = [];
  if (c.isPublic) themes.push("공공");
  if (c.isFree) themes.push("무료");
  if (c.isChabak) themes.push("차박");
  if (c.isCheap && !c.isFree) themes.push("가성비");

  const text = `${c.name} ${c.address ?? ""} ${c.type ?? ""}`.toLowerCase();
  const sido = c.sido;

  if (text.includes("계곡") || text.includes("valley")) themes.push("계곡");

  if (
    text.includes("산") ||
    ["강원", "경북", "경남", "충북"].some((s) => sido.includes(s))
  )
    themes.push("산");

  if (
    text.includes("해수욕") ||
    text.includes("바다") ||
    text.includes("해안") ||
    text.includes("갯벌") ||
    ["제주", "부산", "인천", "강원"].some((s) => sido.includes(s))
  )
    themes.push("해안");

  return [...new Set(themes)];
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(campsites);

  const data: CampsiteMatchData[] = rows.map((c) => {
    const photos = (c.photos as { url: string }[] | null) ?? [];

    const distanceFromCities: Record<string, { km: number; mins: number }> =
      c.lat && c.lng
        ? (c.distanceFromCities as Record<string, { km: number; mins: number }> | null) ??
          calcDistanceFromCities(c.lat, c.lng)
        : {};

    return {
      id: c.id,
      slug: `${encodeURIComponent(c.sido)}/${encodeURIComponent(c.gungu ?? "기타")}/${c.id}`,
      name: c.name,
      sido: c.sido,
      gungu: c.gungu,
      lat: c.lat,
      lng: c.lng,
      themes: buildThemes(c),
      price1Night: c.price1Night,
      fitScore: c.fitScore ?? 0,
      chabakTrustLevel: c.chabakTrustLevel,
      photo: photos[0]?.url ?? undefined,
      distanceFromCities,
    };
  });

  // Try to write to public/ (works locally to refresh the committed seed file)
  // On Vercel, the public directory is read-only — silently skip
  try {
    const filePath = path.join(process.cwd(), "public", "matching-data.json");
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch {
    // Read-only filesystem on Vercel — expected
  }

  return Response.json({ generated: data.length, ok: true });
}
