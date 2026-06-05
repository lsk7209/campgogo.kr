import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, var(--color-forest-800) 0%, var(--color-forest-700) 60%, var(--color-forest-600) 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        fontFamily: "inherit",
      }}
    >
      {/* Logo / Wordmark */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 4 L29 27 L3 27 Z" fill="#F1F7F4" />
            <path d="M16 13 L22 27 L10 27 Z" fill="#244033" />
            <path d="M16 4 L19 10 L13 10 Z" fill="#D88758" />
          </svg>
          <span
            style={{
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#fff" }}>캠핑</span>
            <span style={{ color: "var(--color-sunset-400, #E8935A)" }}>고고</span>
          </span>
        </div>
      </div>

      {/* 404 heading */}
      <p
        style={{
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-forest-300, #A8C4B8)",
          marginBottom: "12px",
        }}
      >
        404
      </p>
      <h1
        style={{
          fontSize: "clamp(22px, 5vw, 32px)",
          fontWeight: 700,
          marginBottom: "16px",
          lineHeight: 1.3,
        }}
      >
        페이지를 찾을 수 없습니다
      </h1>
      <p
        style={{
          fontSize: "15px",
          color: "var(--color-forest-200, #C8DDD5)",
          maxWidth: "340px",
          lineHeight: 1.7,
          marginBottom: "40px",
        }}
      >
        요청하신 주소가 삭제되었거나 잘못 입력되었을 수 있습니다.
      </p>

      {/* Helpful links */}
      <nav aria-label="주요 메뉴">
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          {[
            { href: "/", label: "홈" },
            { href: "/match", label: "야영지 찾기" },
            { href: "/지역", label: "지역별 탐색" },
            { href: "/blog", label: "블로그" },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.18)",
                  transition: "background 0.15s",
                }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
