import { fetchWithRetry, parseJsonWithEucKrFallback } from "./_utils";

const BASE = "https://apis.data.go.kr/B551011/KorService1";

export interface TourSpot {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  mapx: string;
  mapy: string;
  dist: string;
  firstimage?: string;
}

export class TourApiClient {
  constructor(private readonly apiKey: string) {}

  async getNearbySpots(lat: number, lng: number, radius = 5000): Promise<TourSpot[]> {
    const url = new URL(`${BASE}/locationBasedList1`);
    url.searchParams.set("serviceKey", this.apiKey);
    url.searchParams.set("numOfRows", "10");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("MobileOS", "ETC");
    url.searchParams.set("MobileApp", "CampgogoKR");
    url.searchParams.set("_type", "json");
    url.searchParams.set("mapX", String(lng));
    url.searchParams.set("mapY", String(lat));
    url.searchParams.set("radius", String(radius));

    try {
      const res = await fetchWithRetry(url);
      const json = await parseJsonWithEucKrFallback(res) as {
        response: { body: { items: unknown }; header: { resultCode: string } };
      };
      if (json.response.header.resultCode !== "0000") return [];
      const items = json.response.body.items as { item?: TourSpot | TourSpot[] } | null;
      if (!items || !items.item) return [];
      return Array.isArray(items.item) ? items.item : [items.item];
    } catch {
      return [];
    }
  }
}
