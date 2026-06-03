#!/usr/bin/env tsx
/**
 * 고캠핑 API 전체 수집 스크립트
 * 사용: npx tsx scripts/collect-bulk.ts [--dry-run]
 */
import { db } from "../src/lib/db/client";
import { collectCheckpoints, campsites, dataSources } from "../src/lib/db/schema";
import { GoCampingClient, normalizeGoCampingItem } from "../src/lib/api/gocamping";
import { classifyCampsite } from "../src/lib/curation/classify";
import { calcFitScore } from "../src/lib/curation/fit-score";
import { calcDistanceFromCities } from "../src/lib/curation/distance";
import { eq } from "drizzle-orm";

const JOB = "collect-gocamping-bulk";
const DRY_RUN = process.argv.includes("--dry-run");

const API_KEY = process.env.GOCAMPING_API_KEY;
if (!API_KEY) {
  console.error("❌ GOCAMPING_API_KEY 환경변수 없음");
  process.exit(1);
}

async function ensureDataSource(): Promise<string> {
  const sourceId = "gocamping";
  await db
    .insert(dataSources)
    .values({
      id: sourceId,
      name: "한국관광공사 고캠핑",
      url: "https://apis.data.go.kr/B551011/GoCamping",
      license: "공공누리 제1유형",
    })
    .onConflictDoNothing();
  return sourceId;
}

async function main() {
  console.log(`🏕  고캠핑 수집 시작 ${DRY_RUN ? "[DRY RUN]" : ""}`);

  const sourceId = await ensureDataSource();
  const client = new GoCampingClient(API_KEY!);

  // 체크포인트 로드
  const cp = await db
    .select()
    .from(collectCheckpoints)
    .where(eq(collectCheckpoints.jobName, JOB))
    .get();

  // 이미 완료된 경우
  if (cp?.status === "completed") {
    console.log("✅ 이미 완료된 수집입니다. 재실행하려면 DB에서 체크포인트를 삭제하세요.");
    return;
  }

  await db
    .insert(collectCheckpoints)
    .values({ jobName: JOB, status: "running", processed: 0 })
    .onConflictDoUpdate({
      target: collectCheckpoints.jobName,
      set: { status: "running" },
    });

  let count = 0;
  try {
    for await (const item of client.iterateAll(100)) {
      const base = normalizeGoCampingItem(item, sourceId);
      const labels = classifyCampsite(base);
      const fitScore = calcFitScore({ ...base, ...labels });

      const distanceFromCities =
        base.lat && base.lng
          ? calcDistanceFromCities(base.lat, base.lng)
          : null;

      if (!DRY_RUN) {
        await db
          .insert(campsites)
          .values({
            ...base,
            ...labels,
            fitScore,
            distanceFromCities: distanceFromCities as unknown as null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: campsites.id,
            set: {
              name: base.name,
              address: base.address,
              lat: base.lat,
              lng: base.lng,
              facilities: base.facilities,
              photos: base.photos,
              rawData: base.rawData,
              ...labels,
              fitScore,
              distanceFromCities: distanceFromCities as unknown as null,
              updatedAt: new Date(),
            },
          });
      }

      count++;
      if (count % 100 === 0) {
        console.log(`  ${count}건 처리됨...`);
        await db
          .update(collectCheckpoints)
          .set({ processed: count, updatedAt: new Date() })
          .where(eq(collectCheckpoints.jobName, JOB));
      }
    }

    await db
      .update(collectCheckpoints)
      .set({ status: "completed", processed: count, updatedAt: new Date() })
      .where(eq(collectCheckpoints.jobName, JOB));

    console.log(`\n✅ 완료: 총 ${count}건 수집됨`);
  } catch (err) {
    await db
      .update(collectCheckpoints)
      .set({ status: "failed", errorMessage: String(err), updatedAt: new Date() })
      .where(eq(collectCheckpoints.jobName, JOB));
    console.error("❌ 수집 실패:", err);
    process.exit(1);
  }
}

main();
