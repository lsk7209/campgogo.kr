"use client";

import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-forest-50, #F4F9F6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        fontFamily: "inherit",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "var(--color-forest-100, #DFF0E8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
          fontSize: "28px",
        }}
        aria-hidden="true"
      >
        ⛺
      </div>

      <h1
        style={{
          fontSize: "clamp(18px, 4vw, 24px)",
          fontWeight: 700,
          color: "var(--color-forest-800, #2D4A3E)",
          marginBottom: "12px",
          lineHeight: 1.3,
        }}
      >
        문제가 발생했습니다
      </h1>

      {error.message && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-gray-500, #6B7280)",
            background: "var(--color-gray-100, #F3F4F6)",
            border: "1px solid var(--color-gray-200, #E5E7EB)",
            borderRadius: "6px",
            padding: "8px 16px",
            maxWidth: "480px",
            wordBreak: "break-all",
            marginBottom: "28px",
            fontFamily: "monospace",
          }}
        >
          {error.message}
        </p>
      )}

      {!error.message && <div style={{ marginBottom: "28px" }} />}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={reset}
          style={{
            padding: "11px 24px",
            borderRadius: "8px",
            background: "var(--color-forest-700, #3A5E4F)",
            color: "#fff",
            border: "none",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "11px 24px",
            borderRadius: "8px",
            background: "transparent",
            color: "var(--color-forest-700, #3A5E4F)",
            border: "1.5px solid var(--color-forest-300, #A8C4B8)",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
