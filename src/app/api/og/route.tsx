import { ImageResponse } from "next/og";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") ?? "캠핑고고";
  const subtitle = url.searchParams.get("subtitle") ?? "공공·저렴·차박 야영지";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#2D4A3E",
          color: "#F5EFE5",
          padding: "80px",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "20px", color: "#D88758", marginBottom: "16px", fontWeight: 700 }}>
          캠핑고고
        </div>
        <div
          style={{
            fontSize: "52px",
            fontWeight: 800,
            marginBottom: "24px",
            lineHeight: 1.2,
            maxWidth: "800px",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "26px", opacity: 0.85 }}>{subtitle}</div>
        <div style={{ fontSize: "18px", marginTop: "40px", opacity: 0.6 }}>
          campgogo.kr · 예약 앱이 못 보여주는 야영지
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
