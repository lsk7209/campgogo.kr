import { fetchWithRetry } from "./_utils";

const BASE = "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService";

export interface Holiday {
  dateKind: string;
  dateName: string;
  isHoliday: string;
  locdate: number;
  seq: number;
}

export class HolidayClient {
  constructor(private readonly apiKey: string) {}

  async getHolidays(year: number, month?: number): Promise<Holiday[]> {
    const endpoint = month ? "getRestDeInfo" : "getHoliDeInfo";
    const url = new URL(`${BASE}/${endpoint}`);
    url.searchParams.set("serviceKey", this.apiKey);
    url.searchParams.set("solYear", String(year));
    if (month) url.searchParams.set("solMonth", String(month).padStart(2, "0"));
    url.searchParams.set("numOfRows", "50");
    url.searchParams.set("_type", "json");

    try {
      const res = await fetchWithRetry(url);
      const json = await res.json() as {
        response: { body: { items: unknown } };
      };
      const items = json.response.body.items as { item?: Holiday | Holiday[] } | null;
      if (!items || !items.item) return [];
      return Array.isArray(items.item) ? items.item : [items.item];
    } catch {
      return [];
    }
  }
}
