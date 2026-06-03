"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CampsiteEntry {
  id: string;
  slug: string;
  name: string;
  sido: string;
  gungu?: string | null;
  lat: number | null;
  lng: number | null;
  price1Night: number | null;
  fitScore: number;
  themes?: string[];
}

function formatPrice(p: number | null): string {
  if (p === null) return "가격 미정";
  if (p === 0) return "무료";
  return p.toLocaleString("ko-KR") + "원";
}

// Great-circle distance (km) between two lat/lng points
function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const KOREA_CENTER = { lat: 36.5, lng: 127.9 };

export function MapView() {
  const [loading, setLoading] = useState(true);
  const [campsites, setCampsites] = useState<CampsiteEntry[]>([]);

  useEffect(() => {
    fetch("/matching-data.json")
      .then((res) => res.json())
      .then((data: CampsiteEntry[]) => {
        // Keep only entries with valid lat/lng
        const withCoords = data.filter(
          (c) => c.lat != null && c.lng != null
        );

        // Sort: first by fitScore desc, then by distance to Korea center asc
        withCoords.sort((a, b) => {
          if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
          const da = distKm(KOREA_CENTER.lat, KOREA_CENTER.lng, a.lat!, a.lng!);
          const db = distKm(KOREA_CENTER.lat, KOREA_CENTER.lng, b.lat!, b.lng!);
          return da - db;
        });

        setCampsites(withCoords.slice(0, 20));
      })
      .catch(() => setCampsites([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 64px" }}>
      {/* Page heading */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--color-forest-600)",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            width: "22px",
            height: "1.5px",
            background: "var(--color-sunset-500)",
            display: "inline-block",
          }}
        />
        야영지 지도
      </div>

      <h1
        style={{
          fontSize: "clamp(26px, 4vw, 38px)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          color: "var(--color-forest-800)",
          marginBottom: "10px",
        }}
      >
        전국 야영지 지도
      </h1>
      <p
        style={{
          fontSize: "16px",
          lineHeight: 1.75,
          color: "var(--color-gray-600)",
          marginBottom: "40px",
          maxWidth: "560px",
        }}
      >
        전국 공공·차박 야영지를 지도로 찾아보세요. 좌표가 등록된 야영지를 적합도 순으로 보여드립니다.
      </p>

      {/* Map placeholder */}
      <div
        style={{
          width: "100%",
          height: "340px",
          borderRadius: "var(--radius-xl)",
          background: "var(--color-forest-50)",
          border: "2px dashed var(--color-forest-200)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "48px",
          color: "var(--color-forest-600)",
        }}
      >
        <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>🗺️</span>
        <p style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>지도 기능 준비 중</p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--color-gray-500)",
            margin: 0,
            textAlign: "center",
            maxWidth: "320px",
            lineHeight: 1.6,
          }}
        >
          인터랙티브 지도 기능을 준비하고 있습니다.{"\n"}아래 목록에서 야영지를 확인하세요.
        </p>
      </div>

      {/* Campsite grid */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--color-forest-800)",
            marginBottom: "4px",
          }}
        >
          좌표 등록 야영지 TOP 20
          {!loading && (
            <span
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-gray-500)",
                marginLeft: "8px",
              }}
            >
              {campsites.length}곳
            </span>
          )}
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--color-gray-400)", margin: 0 }}>
          적합도 점수 기준 정렬 · 각 카드를 클릭하면 상세 페이지로 이동합니다
        </p>
      </div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--color-gray-200)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {[70, 45, 30].map((w, j) => (
                <div
                  key={j}
                  style={{
                    height: "13px",
                    width: w + "%",
                    background: "var(--color-gray-100)",
                    borderRadius: "4px",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : campsites.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 24px",
            borderRadius: "var(--radius-xl)",
            background: "var(--color-gray-50)",
            border: "1px solid var(--color-gray-200)",
            color: "var(--color-gray-500)",
          }}
        >
          <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏕️</p>
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
            좌표가 등록된 야영지를 불러오지 못했습니다
          </p>
          <p style={{ fontSize: "14px" }}>잠시 후 다시 시도해 주세요.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {campsites.map((c) => (
            <Link
              key={c.id}
              href={`/캠핑장/${c.slug}`}
              style={{
                display: "block",
                border: "1px solid var(--color-gray-200)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
                background: "#fff",
                textDecoration: "none",
                color: "inherit",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-forest-300)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 2px 12px rgba(0,0,0,0.07)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--color-gray-200)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Score badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "var(--color-sunset-100)",
                  color: "var(--color-sunset-700)",
                  border: "1px solid var(--color-sunset-200)",
                  marginBottom: "10px",
                }}
              >
                적합도 {c.fitScore}
              </div>

              <h3
                style={{
                  fontSize: "14.5px",
                  fontWeight: 700,
                  lineHeight: 1.4,
                  marginBottom: "5px",
                  color: "var(--color-forest-800)",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                } as React.CSSProperties}
              >
                {c.name}
              </h3>

              <p
                style={{
                  fontSize: "12.5px",
                  color: "var(--color-gray-500)",
                  marginBottom: "10px",
                }}
              >
                {c.sido}{c.gungu ? ` ${c.gungu}` : ""}
              </p>

              <p
                style={{
                  fontSize: "13.5px",
                  fontWeight: 700,
                  color: "var(--color-forest-700)",
                  margin: 0,
                }}
              >
                {formatPrice(c.price1Night)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
