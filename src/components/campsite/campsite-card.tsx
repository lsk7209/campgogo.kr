import Link from "next/link";
import { ConditionBadges } from "./condition-badges";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

interface CampsiteCardProps {
  id: string;
  name: string;
  sido: string;
  gungu?: string | null;
  price1Night?: number | null;
  isPublic?: boolean | null;
  isFree?: boolean | null;
  isCheap?: boolean | null;
  isChabak?: boolean | null;
  chabakTrustLevel?: ChabakTrust;
  fitScore?: number | null;
  photos?: string[] | null;
  href: string;
}

function FitScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 80 ? "var(--color-forest-500)" : clamped >= 55 ? "var(--color-sunset-500)" : "var(--color-gray-300)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--color-gray-200)", overflow: "hidden" }}>
        <div style={{ width: `${clamped}%`, height: "100%", background: color, borderRadius: "3px" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-gray-600)", flexShrink: 0, minWidth: "28px", textAlign: "right" }}>{clamped}</span>
    </div>
  );
}

export function CampsiteCard({ name, sido, gungu, price1Night, isPublic, isFree, isCheap, isChabak, chabakTrustLevel, fitScore, photos, href }: CampsiteCardProps) {
  const thumbGradient = isChabak
    ? "linear-gradient(135deg, #A98A5E, #6E5736)"
    : "linear-gradient(135deg, var(--color-forest-500), var(--color-forest-800))";
  const firstPhoto = photos && photos.length > 0 ? photos[0] : null;
  const priceLabel = isFree ? "무료" : price1Night != null ? `${price1Night.toLocaleString("ko-KR")}원~` : "가격 미정";

  return (
    <Link href={href} style={{ display: "flex", flexDirection: "column", background: "#fff", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", textDecoration: "none", color: "inherit", transition: "transform 120ms ease, box-shadow 120ms ease" }} aria-label={`${name} — ${sido}${gungu ? ` ${gungu}` : ""}`}>
      <div style={{ position: "relative", aspectRatio: "16 / 10", background: firstPhoto ? undefined : thumbGradient, overflow: "hidden" }}>
        {firstPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={firstPhoto} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
        ) : (
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.04em", color: "rgba(255,255,255,0.5)" }} aria-hidden="true">
            [ 사진 없음 ]
          </span>
        )}
        <span style={{ position: "absolute", top: "10px", left: "10px", padding: "3px 8px", borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: "12px", fontWeight: 600, backdropFilter: "blur(4px)" }}>
          {sido} {gungu}
        </span>
      </div>
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <ConditionBadges isPublic={isPublic} isFree={isFree} isCheap={isCheap} isChabak={isChabak} chabakTrustLevel={chabakTrustLevel} />
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, lineHeight: "1.4", letterSpacing: "-0.01em", color: "var(--color-gray-900)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {name}
        </h3>
        <div style={{ marginTop: "auto", paddingTop: "8px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: isFree ? "14px" : "15px", fontWeight: 700, color: isFree ? "var(--color-sky-700)" : "var(--color-forest-700)" }}>
            {priceLabel}
          </span>
        </div>
        {fitScore != null && fitScore > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--color-gray-400)", marginBottom: "4px" }}>
              <span>적합도</span>
            </div>
            <FitScoreBar score={fitScore} />
          </div>
        )}
      </div>
    </Link>
  );
}
