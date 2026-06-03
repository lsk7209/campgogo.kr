import { haversineKm } from "./distance";

export interface CampsiteForDedup {
  id: string;
  nameNormalized: string | null;
  lat: number | null;
  lng: number | null;
  sido: string;
}

// 이름 유사도 — Jaro-Winkler 단순 구현
function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const s1Len = s1.length;
  const s2Len = s2.length;
  const matchDist = Math.floor(Math.max(s1Len, s2Len) / 2) - 1;

  const s1Matches = new Array(s1Len).fill(false);
  const s2Matches = new Array(s2Len).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1Len; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, s2Len);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < s1Len; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1Len + matches / s2Len + (matches - transpositions / 2) / matches) / 3;

  // Winkler 보정
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1Len, s2Len)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

export interface DedupCandidate {
  aId: string;
  bId: string;
  similarity: number;
  reason: string;
}

const AUTO_MERGE_THRESHOLD = 0.92;   // 자동 병합
const MANUAL_REVIEW_THRESHOLD = 0.72; // 수동 검토 큐

export function findDedupCandidates(
  campsites: CampsiteForDedup[]
): DedupCandidate[] {
  const candidates: DedupCandidate[] = [];

  // 동일 시도 내에서만 비교 (성능)
  const bySido = new Map<string, CampsiteForDedup[]>();
  for (const c of campsites) {
    const list = bySido.get(c.sido) ?? [];
    list.push(c);
    bySido.set(c.sido, list);
  }

  for (const group of bySido.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];

        const nameA = a.nameNormalized ?? "";
        const nameB = b.nameNormalized ?? "";
        const nameSim = jaroWinkler(nameA, nameB);

        // 위치 거리 (km)
        let distKm = Infinity;
        if (a.lat && a.lng && b.lat && b.lng) {
          distKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
        }

        // 이름 유사도 높고 + 거리 가까우면 후보
        if (nameSim >= MANUAL_REVIEW_THRESHOLD && distKm < 2) {
          const similarity = nameSim * 0.7 + (distKm < 0.5 ? 0.3 : distKm < 1 ? 0.2 : 0.1);
          candidates.push({
            aId: a.id,
            bId: b.id,
            similarity: Math.min(1, similarity),
            reason: `이름유사도=${nameSim.toFixed(2)}, 거리=${distKm.toFixed(2)}km`,
          });
        }
      }
    }
  }

  return candidates;
}

export function isAutoMerge(sim: number): boolean {
  return sim >= AUTO_MERGE_THRESHOLD;
}

export function isManualReview(sim: number): boolean {
  return sim >= MANUAL_REVIEW_THRESHOLD && sim < AUTO_MERGE_THRESHOLD;
}
