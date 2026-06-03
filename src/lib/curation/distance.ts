export interface CityCoord {
  lat: number;
  lng: number;
}

export const MAJOR_CITIES: Record<string, CityCoord> = {
  서울: { lat: 37.5665, lng: 126.978 },
  부산: { lat: 35.1796, lng: 129.0756 },
  대구: { lat: 35.8714, lng: 128.6014 },
  광주: { lat: 35.1595, lng: 126.8526 },
  대전: { lat: 36.3504, lng: 127.3845 },
  인천: { lat: 37.4563, lng: 126.7052 },
  수원: { lat: 37.2636, lng: 127.0286 },
  춘천: { lat: 37.8813, lng: 127.7298 },
};

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 주요 도시까지 직선 거리 + 예상 운전 시간 계산
export function calcDistanceFromCities(lat: number, lng: number) {
  const result: Record<string, { km: number; mins: number }> = {};
  for (const [city, coord] of Object.entries(MAJOR_CITIES)) {
    const km = Math.round(haversineKm(lat, lng, coord.lat, coord.lng) * 10) / 10;
    // 고속도로 평균 80km/h + 30% 보정
    const mins = Math.round((km / 80) * 60 * 1.3);
    result[city] = { km, mins };
  }
  return result;
}

export function closestCity(lat: number, lng: number): { city: string; km: number } {
  let minKm = Infinity;
  let closest = "서울";
  for (const [city, coord] of Object.entries(MAJOR_CITIES)) {
    const km = haversineKm(lat, lng, coord.lat, coord.lng);
    if (km < minKm) { minKm = km; closest = city; }
  }
  return { city: closest, km: Math.round(minKm * 10) / 10 };
}
