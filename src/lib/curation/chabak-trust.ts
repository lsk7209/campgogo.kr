export type ChabakTrust = "confirmed" | "estimated" | "reported" | "incident" | null;

export interface ChabakSource {
  type: "official_notice" | "user_report" | "incident" | "news";
  campsiteId: string;
  url?: string;
  date?: string;
  verified?: boolean;
  note?: string;
}

export interface ChabakResult {
  level: ChabakTrust;
  source?: string;
  date?: string;
  note?: string;
}

export function classifyChabakTrust(
  campsiteId: string,
  isPublic: boolean,
  induty: string,
  sources: ChabakSource[]
): ChabakResult {
  const mySources = sources.filter((s) => s.campsiteId === campsiteId);

  // 1. 공식 공지 (확인됨)
  const official = mySources.find((s) => s.type === "official_notice");
  if (official) {
    return { level: "confirmed", source: official.url, date: official.date };
  }

  // 2. 단속 기록 (단속 기록) — 가장 강한 부정 신호
  const incident = mySources.find((s) => s.type === "incident");
  if (incident) {
    return {
      level: "incident",
      source: incident.url,
      date: incident.date,
      note: incident.note,
    };
  }

  // 3. 검증된 사용자 제보 (제보됨)
  const report = mySources.find((s) => s.type === "user_report" && s.verified);
  if (report) {
    return { level: "reported", date: report.date, note: report.note };
  }

  // 4. 자동차 야영장 업종 등록 = 추정됨
  const lowerInduty = induty.toLowerCase();
  if (lowerInduty.includes("자동차") || lowerInduty.includes("오토")) {
    return {
      level: "estimated",
      note: "자동차야영장 업종 등록 — 현장 확인 권고",
    };
  }

  // 5. 공공 야영지 + 자동차 인프라 = 추정됨
  if (isPublic) {
    return {
      level: "estimated",
      note: "공공 야영지 — 차박 허용 여부 현장 확인 필요",
    };
  }

  return { level: null };
}

export const CHABAK_TRUST_LABELS: Record<NonNullable<ChabakTrust>, { label: string; color: string }> = {
  confirmed: { label: "확인됨", color: "#3E7D5A" },
  estimated: { label: "추정됨", color: "#B08433" },
  reported:  { label: "제보됨", color: "#BD6E3C" },
  incident:  { label: "단속 기록", color: "#AD473C" },
};
