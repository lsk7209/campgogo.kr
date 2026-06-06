#!/usr/bin/env tsx
/**
 * public/matching-data.json 생성
 * 사용: npx tsx scripts/build-matching-json.ts
 */
import * as fs from "node:fs";
import { db } from "../src/lib/db/client";
import { campsites } from "../src/lib/db/schema";
import { calcFitScore } from "../src/lib/curation/fit-score";
import { gt, isNotNull, isNull, and } from "drizzle-orm";

interface MatchData {
  id: string;
  slug: string;
  name: string;
  sido: string;
  gungu: string | null;
  lat: number | null;
  lng: number | null;
  themes: string[];
  price1Night: number | null;
  fitScore: number;
  chabakTrustLevel: string | null;
  photo?: string;
  distanceFromCities: Record<string, { km: number; mins: number }>;
}

function buildSlug(c: { id: string; name: string; sido: string; gungu: string | null }): string {
  // URL-safe slug: sido/gungu/id
  const sido = encodeURIComponent(c.sido);
  const gungu = encodeURIComponent(c.gungu ?? "기타");
  return `${sido}/${gungu}/${c.id}`;
}

function buildThemes(c: {
  isPublic: boolean | null;
  isFree: boolean | null;
  isCheap: boolean | null;
  isChabak: boolean | null;
  price1Night: number | null;
  facilities: unknown;
  type: string | null;
}): string[] {
  const themes: string[] = [];
  if (c.isPublic) themes.push("공공");
  if (c.isFree && c.price1Night === 0) themes.push("무료");  // 실제 0원만
  if (c.isChabak) themes.push("차박");
  if (c.isCheap) themes.push("가성비");

  const fac = (c.facilities ?? {}) as Record<string, boolean>;
  if (fac.pool || fac.fishing) themes.push("계곡");
  const type = (c.type ?? "").toLowerCase();
  if (type.includes("산") || type.includes("숲")) themes.push("산");
  if (type.includes("해안") || type.includes("바다")) themes.push("해안");
  return themes;
}

async function main() {
  console.log("🏗  matching-data.json 빌드 시작...");

  // 위경도 있는 야영장 우선 수집 (매칭 도구에서 거리 계산에 필요)
  // 위경도 있는 야영장 (거리 기반 매칭에 필수)
  const withGeoRows = await db
    .select()
    .from(campsites)
    .where(isNotNull(campsites.lat))
    .limit(3000);

  // 위경도 없지만 적합도 높은 야영장 (시/군 필터링용)
  const noGeoRows = await db
    .select()
    .from(campsites)
    .where(and(isNull(campsites.lat), gt(campsites.fitScore, 50)))
    .limit(500);

  const rows = [...withGeoRows, ...noGeoRows];

  console.log(`  ${rows.length}건 로드됨`);

  const data: MatchData[] = rows.map((c) => {
    // distanceFromCities는 클라이언트가 lat/lng로 직접 계산 — JSON에서 제외해 파일 크기 절감
    const distanceFromCities: Record<string, { km: number; mins: number }> = {};

    const photos = (c.photos as { url: string }[] | null) ?? [];
    const photo = photos[0]?.url;

    return {
      id: c.id,
      slug: buildSlug(c),
      name: c.name,
      sido: c.sido,
      gungu: c.gungu,
      lat: c.lat,
      lng: c.lng,
      themes: buildThemes({ ...c, price1Night: c.price1Night }),
      price1Night: c.price1Night,
      fitScore: calcFitScore(c),
      chabakTrustLevel: c.chabakTrustLevel,
      ...(photo ? { photo } : {}),
      distanceFromCities,
    } satisfies MatchData;
  });

  // 적합도 높은 순 정렬
  data.sort((a, b) => b.fitScore - a.fitScore);

  const jsonMin = JSON.stringify(data); // same, no pretty-print for size

  fs.mkdirSync("public", { recursive: true });
  fs.writeFileSync("public/matching-data.json", jsonMin, "utf-8");

  const sizeKb = Math.round(Buffer.byteLength(jsonMin) / 1024);
  console.log(`✅ public/matching-data.json 생성: ${data.length}건, ${sizeKb}KB`);

  // 통계 출력
  const withGeo = data.filter((d) => d.lat && d.lng).length;
  const chabak = data.filter((d) => d.themes.includes("차박")).length;
  const free = data.filter((d) => d.themes.includes("무료")).length;
  const pub = data.filter((d) => d.themes.includes("공공")).length;
  console.log(`  위경도 보유: ${withGeo}건`);
  console.log(`  차박: ${chabak}건 | 무료: ${free}건 | 공공: ${pub}건`);
}

main().catch((e) => {
  console.error("❌ 실패:", e);
  process.exit(1);
});
