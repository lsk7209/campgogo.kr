"use client";

import { useState, useEffect } from "react";

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function TocSidebar({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!items.length) return;
    const ids = items.map((item) => item.id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topmost = visible.sort(
            (a, b) => ids.indexOf(a.target.id) - ids.indexOf(b.target.id)
          )[0];
          setActiveId(topmost.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="toc-sidebar" aria-label="목차">
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-gray-400)",
          marginBottom: "12px",
        }}
      >
        목차
      </div>
      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li
              key={item.id}
              style={{ paddingLeft: item.level === 3 ? "12px" : "0" }}
            >
              <a
                href={`#${item.id}`}
                className="toc-link"
                style={{
                  fontSize: item.level === 3 ? "12.5px" : "13px",
                  color: isActive
                    ? "var(--color-forest-700)"
                    : "var(--color-gray-600)",
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: "none",
                  lineHeight: 1.6,
                  display: "block",
                  padding: "3px 0",
                  borderLeft: isActive
                    ? "2px solid var(--color-forest-600)"
                    : item.level === 2
                    ? "2px solid var(--color-forest-200)"
                    : "2px solid transparent",
                  paddingLeft: item.level === 2 ? "10px" : "22px",
                  transition: "color 120ms, border-color 120ms, font-weight 120ms",
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
