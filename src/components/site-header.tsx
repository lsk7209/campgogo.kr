import Link from "next/link";
import { CampingLogo } from "./camping-logo";

interface SiteHeaderProps {
  activeNav?: string;
}

const navLinks = [
  { href: "/match", label: "매칭" },
  { href: "/지도", label: "지도" },
  { href: "/테마", label: "테마" },
  { href: "/시즌", label: "시즌" },
  { href: "/지역/경기", label: "지역" },
  { href: "/blog", label: "블로그" },
];

export function SiteHeader({ activeNav }: SiteHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(245,239,229,.88)",
        backdropFilter: "saturate(1.1) blur(8px)",
        borderColor: "var(--color-gray-200)",
      }}
    >
      <div
        className="max-w-[1200px] mx-auto px-6 flex items-center gap-5 h-16"
      >
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
        </div>

        <button
          className="md:hidden border rounded-lg px-3 py-2 text-lg"
          aria-label="메뉴 열기"
          style={{
            borderColor: "var(--color-gray-300)",
            color: "var(--color-gray-700)",
          }}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
