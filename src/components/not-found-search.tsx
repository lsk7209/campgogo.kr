"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotFoundSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/캠핑장?q=${encodeURIComponent(q.trim())}` : "/캠핑장");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "8px",
        marginTop: "32px",
        width: "100%",
        maxWidth: "420px",
      }}
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="야영지 이름 또는 지역으로 검색..."
        aria-label="야영지 검색"
        style={{
          flex: 1,
          padding: "10px 16px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(255,255,255,0.12)",
          color: "#fff",
          fontSize: "14px",
          outline: "none",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 18px",
          background: "var(--color-sunset-600)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        검색
      </button>
    </form>
  );
}
