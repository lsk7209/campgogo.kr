import type { InferSelectModel } from "drizzle-orm";
import type { campsites } from "@/lib/db/schema";

type Campsite = InferSelectModel<typeof campsites>;

export function classifyCampsite(c: Partial<Campsite>) {
  const isPublic =
    c.operatorType === "public_central" || c.operatorType === "public_local";

  const price = c.price1Night;
  const isFree = price === 0;                          // null = 가격 미상, 0 = 실제 무료
  const isCheap = price != null && price > 0 && price <= 30_000;

  // 차박 가능 초기 분류 (이후 chabak-trust에서 세분화)
  const type = String(c.type ?? "").toLowerCase();
  const name = String(c.name ?? "").toLowerCase();
  const rawData = c.rawData as Record<string, string> | null;
  const induty = String(rawData?.induty ?? "").toLowerCase();

  const isChabak =
    induty.includes("자동차") ||
    type.includes("자동차") ||
    name.includes("차박") ||
    name.includes("오토") ||
    String(c.facilities ?? "").includes("자동차");

  return { isPublic, isFree, isCheap, isChabak };
}

// 가격 문자열 → 숫자 파싱 ("10,000원/1박" → 10000)
export function parsePriceKrw(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
