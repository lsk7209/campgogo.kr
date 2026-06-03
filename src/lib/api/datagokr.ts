import { fetchWithRetry, parseJsonWithEucKrFallback, normalizeSido } from "./_utils";
import { z } from "zod";

const BASE = "https://api.odcloud.kr/api";

// 전국야영장 표준데이터 API
const ItemSchema = z.object({
  "관리번호": z.string().optional(),
  "시설명": z.string(),
  "소재지도로명주소": z.string().optional(),
  "소재지지번주소": z.string().optional(),
  "위도": z.union([z.string(), z.number()]).optional(),
  "경도": z.union([z.string(), z.number()]).optional(),
  "운영기관명": z.string().optional(),
  "전화번호": z.string().optional(),
  "홈페이지주소": z.string().optional(),
  "편의시설정보": z.string().optional(),
  "휴무일": z.string().optional(),
  "이용요금": z.string().optional(),
  "시도명": z.string().optional(),
  "시군구명": z.string().optional(),
  "데이터기준일자": z.string().optional(),
}).passthrough();

export type DataGokrItem = z.infer<typeof ItemSchema>;

export class DataGoKrClient {
  constructor(private readonly apiKey: string) {}

  async fetchPage(serviceId: string, pageNo: number, perPage = 100) {
    const url = new URL(`${BASE}/${serviceId}/v1/uddi:${serviceId}`);
    url.searchParams.set("page", String(pageNo));
    url.searchParams.set("perPage", String(perPage));
    url.searchParams.set("serviceKey", this.apiKey);

    const res = await fetchWithRetry(url);
    const json = await parseJsonWithEucKrFallback(res) as {
      currentCount: number;
      totalCount: number;
      data: unknown[];
    };
    return json;
  }

  async *iterateAll(serviceId: string, perPage = 100): AsyncGenerator<DataGokrItem> {
    let pageNo = 1;
    while (true) {
      const json = await this.fetchPage(serviceId, pageNo, perPage);
      if (!json.data || json.data.length === 0) break;
      for (const raw of json.data) {
        const parsed = ItemSchema.safeParse(raw);
        if (parsed.success) yield parsed.data;
      }
      if (pageNo * perPage >= json.totalCount) break;
      pageNo++;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

export function normalizeDataGokrItem(item: DataGokrItem, sourceId: string) {
  const sido = normalizeSido(item["시도명"] ?? "");
  const lat = item["위도"] ? parseFloat(String(item["위도"])) : null;
  const lng = item["경도"] ? parseFloat(String(item["경도"])) : null;
  const name = item["시설명"].trim();

  return {
    id: `dg-${name}-${sido}`.replace(/\s+/g, "-").toLowerCase(),
    sourceId,
    externalId: item["관리번호"] ?? null,
    name,
    nameNormalized: name.replace(/\s+/g, "").toLowerCase(),
    sido,
    gungu: item["시군구명"]?.trim() ?? null,
    address: (item["소재지도로명주소"] ?? item["소재지지번주소"] ?? "").trim() || null,
    lat,
    lng,
    type: "campsite",
    operator: item["운영기관명"] ?? null,
    operatorType: "unknown",
    facilities: null,
    photos: null,
    contact: item["전화번호"] ?? null,
    reservationUrl: item["홈페이지주소"] ?? null,
    rawData: JSON.stringify(item),
    isPublic: false,
    isFree: false,
    isCheap: false,
    isChabak: false,
  };
}
