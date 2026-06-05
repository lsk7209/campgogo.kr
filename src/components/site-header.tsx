"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CampingLogo } from "./camping-logo";

interface SiteHeaderProps {
  activeNav?: string;
}

const navLinks = [
  { href: "/캠핑장", label: "캠핑장" },
  { href: "/match", label: "매칭" },
  { href: "/지도", label: "지도" },
  { href: "/테마", label: "테마" },
  { href: "/시즌", label: "시즌" },
  { href: "/지역", label: "지역" },
  { href: "/blog", label: "블로그" },
];

export function SiteHeader({ activeNav }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("cg-theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(245,239,229,.88)",
          backdropFilter: "saturate(1.1) blur(8px)",
          borderColor: "var(--color-gray-200)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-5 h-16">
          <CampingLogo />

          <nav aria-label="주 메뉴" className="hidden md:flex gap-1 ml-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={activeNav === link.href ? "page" : undefined}
                className="text-[14.5px] font-semibold px-3 py-[7px] rounded-lg transition-colors"
                style={{
                  color:
                    activeNav === link.href
                      ? "var(--color-forest-700)"
                      : "var(--color-gray-700)",
                  background:
                    activeNav === link.href
                      ? "var(--color-forest-50)"
                      : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <span
              className="hidden sm:flex items-center gap-1.5 text-[13.5px] bg-white border px-3.5 py-2 rounded-full cursor-text"
              style={{
                color: "var(--color-gray-500)",
                borderColor: "var(--color-gray-200)",
              }}
            >
              🔍 지역·조건 검색
            </span>
            <Link
              href="/match"
              className="text-[13.5px] font-semibold px-3.5 py-2 rounded-lg text-white transition-colors"
              style={{ background: "var(--color-forest-700)" }}
            >
              내 조건으로 찾기
            </Link>
            <button
              onClick={toggleDark}
              aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
              title={isDark ? "라이트 모드" : "다크 모드"}
              className="border rounded-lg px-2.5 py-2 text-[15px] transition-colors"
              style={{
                borderColor: "var(--color-gray-300)",
                color: "var(--color-gray-700)",
                background: "transparent",
              }}
            >
              {isDark ? "☀" : "☽"}
            </button>
          </div>

          <button
            className="md:hidden border rounded-lg px-3 py-2 text-lg"
            aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsOpen((v) => !v)}
            style={{
              borderColor: "var(--color-gray-300)",
              color: "var(--color-gray-700)",
            }}
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="모바일 메뉴"
            className="fixed top-16 left-0 right-0 z-40 border-b"
            style={{
              background: "rgba(245,239,229,.97)",
              borderColor: "var(--color-gray-200)",
            }}
          >
            <ul className="max-w-[1200px] mx-auto px-6 py-3 flex flex-col gap-1" style={{ listStyle: "none", margin: 0, padding: "12px 24px" }}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={activeNav === link.href ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className="block text-[15px] font-semibold px-4 py-3 rounded-lg transition-colors"
                    style={{
                      color:
                        activeNav === link.href
                          ? "var(--color-forest-700)"
                          : "var(--color-gray-700)",
                      background:
                        activeNav === link.href
                          ? "var(--color-forest-50)"
                          : "transparent",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
