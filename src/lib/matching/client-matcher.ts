export interface CampsiteMatchData {
  id: string; slug: string; name: string; sido: string; gungu: string | null;
  lat: number | null; lng: number | null; themes: string[];
  price1Night: number | null; fitScore: number; chabakTrustLevel: string | null;
  photo?: string; distanceFromCities: Record<string, { km: number; mins: number }>;
}
export interface MatchInput {
  themes?: string[]; budget?: "free" | "10000" | "30000" | "any";
  legalityFilter?: "confirmed_only" | "any"; from?: string; radius?: number;
}
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "서울": { lat: 37.5665, lng: 126.978 }, "부산": { lat: 35.1796, lng: 129.0756 },
  "대구": { lat: 35.8714, lng: 128.6014 }, "광주": { lat: 35.1595, lng: 126.8526 },
  "대전": { lat: 36.3504, lng: 127.3845 }, "인천": { lat: 37.4563, lng: 126.7052 },
  "수원": { lat: 37.2636, lng: 127.0286 }, "춘천": { lat: 37.8813, lng: 127.7298 },
};
let cache: CampsiteMatchData[] | null = null;
async function loadData(): Promise<CampsiteMatchData[]> {
  if (cache) return cache;
  const res = await fetch("/matching-data.json");
  if (!res.ok) throw new Error("매칭 데이터 로드 실패: " + res.status);
  cache = (await res.json()) as CampsiteMatchData[];
  return cache;
}
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
export async function runMatching(input: MatchInput): Promise<CampsiteMatchData[]> {
  const all = await loadData();
  let results = all.filter(c => {
    if (input.themes?.length && !input.themes.some(t => c.themes.includes(t))) return false;
    if (input.budget === "free" && c.price1Night !== 0) return false;
    if (input.budget === "10000" && (c.price1Night == null || c.price1Night > 10000)) return false;
    if (input.budget === "30000" && (c.price1Night == null || c.price1Night > 30000)) return false;
    if (input.legalityFilter === "confirmed_only" && c.chabakTrustLevel !== "confirmed") return false;
    return true;
  });
  if (input.from) {
    const city = CITY_COORDS[input.from];
    if (city) {
      const r = input.radius ?? 100;
      const withDist = results
        .filter(c => c.lat != null && c.lng != null && haversineKm(city.lat, city.lng, c.lat!, c.lng!) <= r)
        .map(c => ({ ...c, _d: haversineKm(city.lat, city.lng, c.lat!, c.lng!) }))
        .sort((a, b) => a._d - b._d);
      results = withDist.map(({ _d, ...rest }) => rest as CampsiteMatchData);
    }
  } else {
    results = results.slice().sort((a, b) => b.fitScore - a.fitScore);
  }
  return results.slice(0, 12);
}
