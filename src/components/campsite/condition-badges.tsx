import type { ReactNode } from "react";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

interface ConditionBadgesProps {
  isPublic?: boolean | null;
  isFree?: boolean | null;
  isCheap?: boolean | null;
  isChabak?: boolean | null;
  chabakTrustLevel?: ChabakTrust;
}

const CHABAK_TRUST_COLOR: Record<NonNullable<ChabakTrust>, string> = {
  confirmed: "#3E7D5A", estimated: "#B08433", reported: "#BD6E3C", incident: "#AD473C",
};
const CHABAK_TRUST_BG: Record<NonNullable<ChabakTrust>, string> = {
  confirmed: "#EBF5EE", estimated: "#FDF5D8", reported: "#FEF0E6", incident: "#FFF0EF",
};
const CHABAK_TRUST_LABEL: Record<NonNullable<ChabakTrust>, string> = {
  confirmed: "차박확인", estimated: "차박추정", reported: "차박제보", incident: "단속기록",
};

function Badge({ label, bg, color, border }: { label: string; bg: string; color: string; border: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "var(--radius-sm)", fontSize: "11.5px", fontWeight: 700, lineHeight: 1.5, letterSpacing: "0.02em", background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

export function ConditionBadges({ isPublic, isFree, isCheap, isChabak, chabakTrustLevel }: ConditionBadgesProps) {
  const badges: ReactNode[] = [];

  if (isPublic) badges.push(<Badge key="public" label="공공" bg="var(--color-forest-50)" color="var(--color-forest-700)" border="var(--color-forest-200)" />);
  if (isFree) badges.push(<Badge key="free" label="무료" bg="var(--color-sky-100)" color="var(--color-sky-700)" border="var(--color-sky-200)" />);
  else if (isCheap) badges.push(<Badge key="cheap" label="가성비" bg="var(--color-sunset-100)" color="var(--color-sunset-700)" border="var(--color-sunset-200)" />);

  if (isChabak && chabakTrustLevel && chabakTrustLevel in CHABAK_TRUST_LABEL) {
    badges.push(<Badge key="chabak" label={CHABAK_TRUST_LABEL[chabakTrustLevel]} bg={CHABAK_TRUST_BG[chabakTrustLevel]} color={CHABAK_TRUST_COLOR[chabakTrustLevel]} border={CHABAK_TRUST_BG[chabakTrustLevel]} />);
  } else if (isChabak) {
    badges.push(<Badge key="chabak-default" label="차박" bg="#EBF5EE" color="#3E7D5A" border="#C6E2D0" />);
  }

  if (badges.length === 0) return null;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>{badges}</div>;
}
