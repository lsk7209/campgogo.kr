import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "캠핑고고 — 예약 앱이 못 보여주는 야영지",
  description:
    "공공·저렴·차박 가능 야영지를 찾아주는 사이트. 무료 노지부터 차박 합법성 확인까지.",
};

export default function HomePage() {
  return (
    <>
      <SiteHeader activeNav="/" />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div
          className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase mb-5"
          style={{ color: "var(--color-forest-600)" }}
        >
          <span
            className="inline-block w-[22px]"
            style={{ height: "1.5px", background: "var(--color-sunset-500)" }}
          />
          캠핑고고
        </div>
        <h1
          className="font-extrabold tracking-[-0.02em] leading-[1.2] mb-6 max-w-[700px]"
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            color: "var(--color-forest-800)",
          }}
        >
          예약 앱이 못 보여주는
          <br />
          야영지를 찾아드립니다
        </h1>
        <p
          className="text-[18px] leading-[1.75] max-w-[520px] mb-10"
          style={{ color: "var(--color-gray-600)" }}
        >
          공공·저렴·차박 야영지. 후기 커뮤니티도, 실시간 예약도 아닙니다.
          정확한 정보와 합법성 확인에 집중합니다.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/match"
            className="font-semibold text-[15px] px-6 py-3 rounded-lg text-white transition-colors"
            style={{ background: "var(--color-forest-700)" }}
          >
            내 조건으로 찾기 →
          </Link>
          <Link
            href="/blog"
            className="font-semibold text-[15px] px-6 py-3 rounded-lg border transition-colors"
            style={{
              background: "#fff",
              color: "var(--color-forest-700)",
              borderColor: "var(--color-forest-300)",
            }}
          >
            가이드 & 블로그
          </Link>
        </div>
        <p
          className="mt-16 text-[13px]"
          style={{ color: "var(--color-gray-400)" }}
        >
          🚧 현재 개발 중 — 서비스 준비 중입니다
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
