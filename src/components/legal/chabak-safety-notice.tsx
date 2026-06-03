import type { ChabakTrust } from "@/lib/curation/chabak-trust";

const NOTICE_TEXT: Record<NonNullable<ChabakTrust>, string> = {
  confirmed: "공식 공지 또는 운영기관 확인을 기반으로 차박 허용이 확인된 장소입니다. 방문 전 최신 공지를 재확인하시기 바랍니다.",
  estimated: "차박 허용 여부는 업종 등록·시설 정보를 기준으로 추정되며, 공식 확인은 아닙니다. 방문 전 관리소 또는 관할 지자체에 직접 확인하세요.",
  reported: "사용자 제보를 기반으로 차박이 가능한 것으로 알려진 장소입니다. 공식 확인이 아니므로 현장에서 반드시 재확인하세요.",
  incident: "이 장소에서 차박 관련 단속 사례가 보고되었습니다. 방문 전 반드시 관할 기관에 허용 여부를 확인하시기 바랍니다.",
};

const NOTICE_STYLE: Record<NonNullable<ChabakTrust>, { bg: string; border: string; text: string; iconBg: string; icon: string }> = {
  confirmed: { bg: "var(--color-forest-50)", border: "var(--color-forest-200)", text: "var(--color-forest-700)", iconBg: "var(--color-forest-100)", icon: "✓" },
  estimated:  { bg: "#FFF8E7", border: "#E8C96A", text: "#7A5B00", iconBg: "#FDEEA0", icon: "~" },
  reported:   { bg: "var(--color-sunset-100)", border: "var(--color-sunset-200)", text: "var(--color-sunset-700)", iconBg: "var(--color-sunset-200)", icon: "!" },
  incident:   { bg: "#FFF2F0", border: "#E08080", text: "#9E2B2B", iconBg: "#FFD7D5", icon: "✗" },
};

interface ChabakSafetyNoticeProps {
  chabakTrustLevel: ChabakTrust;
  chabakSource?: string | null;
  chabakSourceDate?: string | null;
}

export function ChabakSafetyNotice({ chabakTrustLevel, chabakSource, chabakSourceDate }: ChabakSafetyNoticeProps) {
  if (!chabakTrustLevel) return null;
  const st = NOTICE_STYLE[chabakTrustLevel];
  return (
    <div role="note" style={{ display: "flex", gap: "12px", padding: "16px 18px", borderRadius: "var(--radius-lg)", border: `1px solid ${st.border}`, background: st.bg }}>
      <div aria-hidden="true" style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%", background: st.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: st.text }}>
        {st.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "14px", lineHeight: "1.65", color: st.text, margin: 0 }}>{NOTICE_TEXT[chabakTrustLevel]}</p>
        {(chabakSource || chabakSourceDate) && (
          <p style={{ marginTop: "6px", fontSize: "12.5px", color: st.text, opacity: 0.75 }}>
            {chabakSourceDate && `기준일: ${chabakSourceDate}`}
            {chabakSource && chabakSourceDate && " · "}
            {chabakSource && <a href={chabakSource} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>출처 보기</a>}
          </p>
        )}
      </div>
    </div>
  );
}
