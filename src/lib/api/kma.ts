import { fetchWithRetry } from "./_utils";

const BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService2.0";

export interface WeatherForecast {
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
}

// 위경도 → 기상청 격자 좌표 변환 (Lambert Conformal Conic)
export function latLngToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.log(Math.cos(slat1) / Math.cos(slat2));
  sn /= Math.log(Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5));
  const sf = (Math.tan(Math.PI * 0.25 + slat1 * 0.5) ** sn) * Math.cos(slat1) / sn;
  const ro = re * sf / (Math.tan(Math.PI * 0.25 + olat * 0.5) ** sn);

  const ra = re * sf / (Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5) ** sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

export class KmaClient {
  constructor(private readonly apiKey: string) {}

  async getShortForecast(lat: number, lng: number, baseDate: string, baseTime: string): Promise<WeatherForecast[]> {
    const { nx, ny } = latLngToGrid(lat, lng);
    const url = new URL(`${BASE}/getVilageFcst`);
    url.searchParams.set("serviceKey", this.apiKey);
    url.searchParams.set("numOfRows", "288");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("dataType", "JSON");
    url.searchParams.set("base_date", baseDate);
    url.searchParams.set("base_time", baseTime);
    url.searchParams.set("nx", String(nx));
    url.searchParams.set("ny", String(ny));

    try {
      const res = await fetchWithRetry(url);
      const json = await res.json() as {
        response: { body: { items: { item: WeatherForecast[] } }; header: { resultCode: string } };
      };
      if (json.response.header.resultCode !== "00") return [];
      return json.response.body.items.item;
    } catch {
      return [];
    }
  }
}
