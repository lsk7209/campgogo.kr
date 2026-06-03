#!/usr/bin/env tsx
/**
 * 한국관광공사 전국 야영장 등록 현황 CSV 임포트
 * 사용: npx tsx scripts/import-csv.ts <csv경로>
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { db } from "../src/lib/db/client";
import { campsites, dataSources } from "../src/lib/db/schema";
import { classifyCampsite } from "../src/lib/curation/classify";
import { calcFitScore } from "../src/lib/curation/fit-score";
import { calcDistanceFromCities } from "../src/lib/curation/distance";
import { normalizeSido } from "../src/lib/api/_utils";

const CSV_PATH = process.argv[2] ?? "C:/Users/dlatj/Downloads/한국관광공사 전국 야영장 등록 현황_20260210.csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseFacilities(facilityStr: string): Record<string, boolean> {
  const s = facilityStr.toLowerCase();
  return {
    electric: s.includes("전기"),
    hotwater: s.includes("온수"),
    shower: s.includes("샤워") || s.includes("수세식"),
    toilet: s.includes("화장실"),
    water: s.includes("급수") || s.includes("수도"),
    wifi: s.includes("무선인터넷") || s.includes("wifi"),
    store: s.includes("마트") || s.includes("편의점"),
    parking: s.includes("주차"),
    pool: s.includes("물놀이"),
    playground: s.includes("놀이터"),
    firepit: s.includes("화로"),
    firewood: s.includes("장작"),
    fishing: s.includes("낚시"),
  };
}

async function ensureDataSource(): Promise<string> {
  const id = "kcsvdata";
  await db.insert(dataSources).values({
    id,
    name: "한국관광공사 전국 야영장 등록 현황",
    url: "https://www.data.go.kr",
    license: "공공누리 제1유형",
    lastFetchedAt: new Date(),
    notes: "CSV 임포트 2026-02-10 기준 데이터",
  }).onConflictDoNothing();
  return id;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error("❌ CSV 파일 없음:", CSV_PATH);
    process.exit(1);
  }

  console.log("📂 CSV 임포트 시작:", path.basename(CSV_PATH));
  const sourceId = await ensureDataSource();

  // EUC-KR 읽기 — iconv-lite 없이 Node.js Buffer decode
  const buf = fs.readFileSync(CSV_PATH);
  // Try to decode as UTF-8 first, fallback handled below
  let content: string;
  try {
    const { default: iconv } = await import("iconv-lite").catch(() => ({ default: null }));
    if (iconv) {
      content = iconv.decode(buf, "euc-kr");
    } else {
      content = buf.toString("latin1");
    }
  } catch {
    content = buf.toString("latin1");
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  // 헤더 스킵
  const dataLines = lines.slice(1);
  console.log(`  총 ${dataLines.length}행`);

  let inserted = 0;
  let skipped = 0;
  const BATCH = 50;

  for (let i = 0; i < dataLines.length; i += BATCH) {
    const batch = dataLines.slice(i, i + BATCH);

    for (const line of batch) {
      const cols = parseCSVLine(line);
      if (cols.length < 5) { skipped++; continue; }

      const [
        num, name, operator, doRaw, gungu, address,
        generalSites, carSites, glamping, caravan, personalCaravan,
        , , , , , , , , , , ,
        licenseDate, firePit, facilities, nearbyFacilities,
        , , , , theme, equipRental, petFriendly,
      ] = cols;

      if (!name?.trim()) { skipped++; continue; }

      const sido = normalizeSido(doRaw ?? "");
      const isChabak = parseInt(carSites ?? "0") > 0;
      const isPublic = !operator?.trim();
      const fac = parseFacilities(facilities ?? "");
      const id = `csv-${num?.padStart(6, "0") ?? i}`;

      const base = {
        id,
        sourceId,
        externalId: num ?? String(i),
        name: name.trim(),
        nameNormalized: name.trim().replace(/\s+/g, "").toLowerCase(),
        sido,
        gungu: gungu?.trim() ?? null,
        address: address?.trim() ?? null,
        lat: null,
        lng: null,
        type: isChabak ? "자동차야영장" : parseInt(glamping ?? "0") > 0 ? "글램핑" : "일반야영장",
        operator: operator?.trim() || null,
        operatorType: isPublic ? "public_local" : "private",
        price1Night: null,
        facilities: fac as unknown as null,
        photos: null,
        contact: null,
        reservationUrl: null,
        rawData: JSON.stringify({ num, name, operator, doRaw, gungu, address, facilities, nearbyFacilities, theme, petFriendly }) as unknown as null,
        isPublic,
        isFree: false,
        isCheap: false,
        isChabak,
        chabakTrustLevel: null,
      };

      const labels = classifyCampsite(base);
      const fitScore = calcFitScore({ ...base, ...labels });

      try {
        await db.insert(campsites).values({
          ...base,
          ...labels,
          fitScore,
        }).onConflictDoNothing();
        inserted++;
      } catch {
        skipped++;
      }
    }

    if ((i / BATCH) % 10 === 0) {
      console.log(`  ${inserted}건 처리됨...`);
    }
  }

  console.log(`\n✅ 완료: ${inserted}건 삽입, ${skipped}건 스킵`);

  // 통계
  const stats = await db.execute("SELECT COUNT(*) as cnt FROM campsites");
  console.log(`📊 DB 총 야영장: ${(stats.rows[0] as { cnt: number }).cnt}건`);
}

main().catch((e) => {
  console.error("❌ 실패:", e);
  process.exit(1);
});
