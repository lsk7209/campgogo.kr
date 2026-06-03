import { fetchWithRetry, parseJsonWithEucKrFallback, normalizeSido } from "./_utils";
import { z } from "zod";

const BASE = "https://apis.data.go.kr/B551011/GoCamping";

const ItemSchema = z.object({
  contentId: z.string(),
  facltNm: z.string(),
  lineIntro: z.string().optional(),
  intro: z.string().optional(),
  featureNm: z.string().optional(),
  induty: z.string().optional(),           // 업종 (일반야영장, 자동차야영장 등)
  lctCl: z.string().optional(),            // 위치유형
  doNm: z.string().optional(),             // 도명
  sigunguNm: z.string().optional(),        // 시군구명
  zipcode: z.string().optional(),
  addr1: z.string().optional(),
  addr2: z.string().optional(),
  mapX: z.string().optional(),             // 경도
  mapY: z.string().optional(),             // 위도
  tel: z.string().optional(),
  resveUrl: z.string().optional(),
  resveCl: z.string().optional(),
  mangeDivNm: z.string().optional(),       // 관리주체
  mgcDiv: z.string().optional(),
  operDe: z.string().optional(),
  operPdCl: z.string().optional(),
  sbrsCl: z.string().optional(),           // 부대시설 (주차, 전기 등)
  sbrsEtc: z.string().optional(),
  toiletCo: z.string().optional(),
  swrmCo: z.string().optional(),
  wtrplCo: z.string().optional(),
  brazierCl: z.string().optional(),
  siteBottomCl1: z.string().optional(),
  siteBottomCl2: z.string().optional(),
  siteBottomCl3: z.string().optional(),
  siteBottomCl4: z.string().optional(),
  siteBottomCl5: z.string().optional(),
  glampInnerFclty: z.string().optional(),
  caravInnerFclty: z.string().optional(),
  prmisnDe: z.string().optional(),
  hvofBgnde: z.string().optional(),
  hvofEnddle: z.string().optional(),
  firstImageUrl: z.string().optional(),
  createdtime: z.string().optional(),
  modifiedtime: z.string().optional(),
}).passthrough();

export type GoCampingItem = z.infer<typeof ItemSchema>;

const BodySchema = z.object({
  items: z.object({ item: z.array(z.unknown()) }).optional(),
  totalCount: z.number(),
  pageNo: z.number(),
  numOfRows: z.number(),
});

export class GoCampingClient {
  constructor(private readonly apiKey: string) {}

  async fetchPage(pageNo: number, numOfRows = 100) {
    const url = new URL(`${BASE}/basedList`);
    url.searchParams.set("serviceKey", this.apiKey);
    url.searchParams.set("numOfRows", String(numOfRows));
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("MobileOS", "ETC");
    url.searchParams.set("MobileApp", "CampgogoKR");
    url.searchParams.set("_type", "json");

    const res = await fetchWithRetry(url);
    const json = await parseJsonWithEucKrFallback(res) as { response: { header: { resultCode: string; resultMsg: string }; body: unknown } };

    const { header, body } = json.response;
    if (header.resultCode !== "0000") {
      throw new Error(`GoCamping API 오류: ${header.resultMsg}`);
    }

    return BodySchema.parse(body);
  }

  async *iterateAll(numOfRows = 100): AsyncGenerator<GoCampingItem> {
    let pageNo = 1;
    while (true) {
      const body = await this.fetchPage(pageNo, numOfRows);
      const items = (body.items?.item ?? []) as unknown[];
      for (const raw of items) {
        const parsed = ItemSchema.safeParse(raw);
        if (parsed.success) yield parsed.data;
      }
      if (pageNo * numOfRows >= body.totalCount || items.length === 0) break;
      pageNo++;
      await new Promise((r) => setTimeout(r, 200)); // rate limit
    }
  }
}

// GoCamping 아이템 → campsites DB 행으로 정규화
export function normalizeGoCampingItem(item: GoCampingItem, sourceId: string) {
  const facilitiesStr = `${item.sbrsCl ?? ""} ${item.sbrsEtc ?? ""}`.toLowerCase();
  const facilities = {
    toilet: (Number(item.toiletCo) || 0) > 0 || facilitiesStr.includes("화장실"),
    shower: (Number(item.swrmCo) || 0) > 0 || facilitiesStr.includes("샤워"),
    water: facilitiesStr.includes("급수") || facilitiesStr.includes("수도"),
    electric: facilitiesStr.includes("전기"),
    hotwater: facilitiesStr.includes("온수"),
    store: facilitiesStr.includes("매점"),
    parking: facilitiesStr.includes("주차"),
    wifi: facilitiesStr.includes("wifi") || facilitiesStr.includes("와이파이"),
    firewood: facilitiesStr.includes("장작"),
    bbq: facilitiesStr.includes("바비큐") || facilitiesStr.includes("bbq"),
  };

  const operatorType = detectOperatorType(item.mangeDivNm ?? "", item.induty ?? "");
  const sido = normalizeSido(item.doNm ?? "");

  return {
    id: `gc-${item.contentId}`,
    sourceId,
    externalId: item.contentId,
    name: item.facltNm.trim(),
    nameNormalized: item.facltNm.trim().replace(/\s+/g, "").toLowerCase(),
    sido,
    gungu: item.sigunguNm?.trim() ?? null,
    address: [item.addr1, item.addr2].filter(Boolean).join(" ").trim() || null,
    lat: item.mapY ? parseFloat(item.mapY) : null,
    lng: item.mapX ? parseFloat(item.mapX) : null,
    type: item.induty ?? "campsite",
    operator: item.mangeDivNm ?? null,
    operatorType,
    facilities: facilities as unknown as null,
    photos: item.firstImageUrl
      ? JSON.stringify([{ url: item.firstImageUrl, source: "gocamping", license: "공공누리 제1유형" }])
      : null,
    contact: item.tel ?? null,
    reservationUrl: item.resveUrl ?? null,
    rawData: JSON.stringify(item),
    isPublic: operatorType === "public_local" || operatorType === "public_central",
    isFree: false,
    isCheap: false,
    isChabak: item.induty?.includes("자동차") ?? false,
  };
}

function detectOperatorType(mangeDivNm: string, induty: string): string {
  const s = (mangeDivNm + induty).toLowerCase();
  if (s.includes("국립") || s.includes("산림청") || s.includes("환경부")) return "public_central";
  if (
    s.includes("시립") || s.includes("군립") || s.includes("도립") ||
    s.includes("지자체") || s.includes("시설공단") || s.includes("농어촌")
  ) return "public_local";
  if (s.includes("민간") || s.includes("사설")) return "private";
  return "unknown";
}
