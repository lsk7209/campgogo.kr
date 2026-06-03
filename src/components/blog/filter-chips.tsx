"use client";

import { useState } from "react";

const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "chabak", label: "차박 가이드" },
  { id: "season", label: "시즌 추천" },
  { id: "budget", label: "가성비 노지" },
  { id: "data", label: "데이터 · 정책" },
  { id: "gear", label: "장비 · 준비물" },
  { id: "pet", label: "반려동물" },
];

export function FilterChips() {
  const [active, setActive] = useState("all");

  return (
    <div
      className="flex gap-2.5 overflow-x-auto pb-5 border-b mb-9"
      style={{
        scrollbarWidth: "none",
        borderColor: "var(--color-gray-200)",
        paddingTop: "8px",
      }}
      role="tablist"
      aria-label="카테고리 필터"
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => setActive(cat.id)}
          className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold px-[15px] py-2 rounded-full border cursor-pointer transition-all whitespace-nowrap flex-none"
          style={
            active === cat.id
              ? {
                  background: "var(--color-forest-700)",
                  color: "#fff",
                  borderColor: "var(--color-forest-700)",
                }
              : {
                  background: "#fff",
                  color: "var(--color-gray-700)",
                  borderColor: "var(--color-gray-300)",
                }
          }
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
