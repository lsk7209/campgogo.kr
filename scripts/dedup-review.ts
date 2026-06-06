#!/usr/bin/env tsx
/**
 * dedup 후보 큐를 CSV로 출력
 * 사용: npx tsx scripts/dedup-review.ts > dedup-queue.csv
 */
import { db } from "../src/lib/db/client";
import { campsites, dedupReview } from "../src/lib/db/schema";
import { findDedupCandidates, isAutoMerge } from "../src/lib/curation/dedup";

async function main() {
  console.error("🔍 dedup 분석 중...");

  const all = await db
    .select({
      id: campsites.id,
      nameNormalized: campsites.nameNormalized,
      lat: campsites.lat,
      lng: campsites.lng,
      sido: campsites.sido,
    })
    .from(campsites)
    .all();

  console.error(`  총 ${all.length}건 로드됨`);

  const candidates = findDedupCandidates(all);
  console.error(`  후보 ${candidates.length}쌍 발견`);

  let autoCount = 0;
  let manualCount = 0;

  // CSV 헤더
  console.log("aId,bId,similarity,reason,action");

  for (const c of candidates) {
    const action = isAutoMerge(c.similarity) ? "auto_merge" : "manual_review";
    if (action === "auto_merge") autoCount++;
    else manualCount++;

    console.log(`${c.aId},${c.bId},${c.similarity.toFixed(3)},"${c.reason}",${action}`);

    // DB에 저장
    await db
      .insert(dedupReview)
      .values({
        candidateAId: c.aId,
        candidateBId: c.bId,
        similarity: c.similarity,
        status: action === "auto_merge" ? "merged" : "pending",
      })
      .onConflictDoNothing();
  }

  console.error(`\n자동 병합: ${autoCount}건, 수동 검토: ${manualCount}건`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
