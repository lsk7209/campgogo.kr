import type { ChabakTrust } from "@/lib/curation/chabak-trust";

const TRUST_CONFIG: Record<
  NonNullable<ChabakTrust>,
  { label: string; bg: string; border: string; text: string; icon: string }
> = {
  confirmed: { label: "차박 확인됨", bg: "var(--color-forest-50)", border: "var(--color-forest-300)", text: "var(--color-forest-700)", icon: "✓" },
  estimated: { label: "차박 추정됨", bg: "#FFF8E7", border: "#E8C96A", text: "#7A5B00", icon: "~" },
  reported: { label: "차박 제보됨", bg: "var(--color-sunset-100)", border: "var(--color-sunset-500)", text: "var(--color-sunset-700)", icon: "!" },
  incident: { label: "단속 기록 있음", bg: "#FFF2F0", border: "#E08080", text: "#9E2B2B", icon: "✗" },
};

interface LegalitySignalProps {
  isChabak: boolean;
  chabakTrustLevel: ChabakTrust;
  isPublic: boolean;
  className?: string;
}

export function LegalitySignal({ isChabak, chabakTrustLevel, isPublic, className }: LegalitySignalProps) {
  if (!isChabak || !chabakTrustLevel) return null;
  const cfg = TRUST_CONFIG[chabakTrustLevel];
  return (
    <div
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "5px 12px", borderRadius: "var(--radius-md)",
        border: `1px solid ${cfg.border}`, background: cfg.bg,
        fontSize: "13px", fontWeight: 600, color: cfg.text,
      }}
      role="status"
      aria-label={`차박 합법성: ${cfg.label}`}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
      {isPublic && (
        <span style={{ marginLeft: "4px", padding: "1px 6px", borderRadius: "var(--radius-sm)", background: "var(--color-forest-100)", color: "var(--color-forest-700)", fontSize: "11.5px", fontWeight: 700 }}>
          공공
        </span>
      )}
    </div>
  );
}
