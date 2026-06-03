import type { InferSelectModel } from "drizzle-orm";
import type { campsites } from "@/lib/db/schema";

type Campsite = InferSelectModel<typeof campsites>;
type Facilities = Record<string, boolean>;

export function calcFitScore(c: Partial<Campsite>): number {
  let score = 0;

  // 공공 여부 (+30)
  if (c.isPublic) score += 30;

  // 무료/저렴 (+25)
  if (c.isFree || c.isCheap) score += 25;

  // 차박 신뢰도 가산
  if (c.chabakTrustLevel === "confirmed") score += 20;
  else if (c.chabakTrustLevel === "estimated") score += 10;
  else if (c.chabakTrustLevel === "reported") score += 5;

  // 시설 가산 (최대 15점)
  const fac = (c.facilities ?? {}) as Facilities;
  const facilityKeys: (keyof Facilities)[] = [
    "toilet", "water", "electric", "hotwater", "shower", "parking",
  ];
  const facilityCount = facilityKeys.filter((k) => fac[k]).length;
  score += Math.min(15, facilityCount * 2.5);

  // 사진 보유 (+10)
  const photos = c.photos as unknown[];
  if (Array.isArray(photos) && photos.length >= 1) score += 10;

  // 인기 유료 글램핑 감점 (-10)
  if (
    c.operatorType === "private" &&
    c.price1Night != null &&
    c.price1Night > 50_000
  ) {
    score -= 10;
  }

  // 단속 기록 감점 (-20)
  if (c.chabakTrustLevel === "incident") score -= 20;

  return Math.max(0, Math.round(score));
}

export const FIT_SCORE_THRESHOLD = 50; // 인덱싱 최소 기준
