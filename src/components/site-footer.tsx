import Link from "next/link";
import { CampingLogo } from "./camping-logo";

export function SiteFooter() {
  return (
    <footer style={{ background: "var(--color-forest-800)", color: "var(--color-forest-100)", marginTop: "80px" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Top */}
        <div className="footer-top-grid py-14 pb-10">
          {/* Brand */}
          <div>
            <CampingLogo inverted />
            <p
              className="text-[13.5px] leading-[1.7] mt-3.5 max-w-[280px]"
              style={{ color: "var(--color-forest-200)" }}
            >
              예약 앱이 못 보여주는 공공·저렴·차박 야영지를 찾아주는 사이트.
              후기 커뮤니티도, 실시간 예약도 아닙니다 — 정확한 정보와 합법성
              확인에 집중합니다.
            </p>
          </div>

          {/* Nav */}
          <FooterCol title="둘러보기">
            <FooterLink href="/match">조건 매칭</FooterLink>
            <FooterLink href="/지도">지도</FooterLink>
            <FooterLink href="/테마">테마별</FooterLink>
            <FooterLink href="/시즌">시즌별</FooterLink>
            <FooterLink href="/지역/경기">지역별</FooterLink>
            <FooterLink href="/blog">블로그</FooterLink>
          </FooterCol>

          <FooterCol title="정책 · 정보">
            <FooterLink href="/about">소개</FooterLink>
            <FooterLink href="/editorial">편집 정책</FooterLink>
            <FooterLink href="/data-license">데이터 라이선스</FooterLink>
            <FooterLink href="/ads">광고·제휴 정책</FooterLink>
            <FooterLink href="/contact">정보 제보</FooterLink>
          </FooterCol>

          <FooterCol title="약관 · 개인정보">
            <FooterLink href="/terms">이용약관</FooterLink>
            <FooterLink href="/privacy">개인정보처리방침</FooterLink>
            <FooterLink href="/cookies">쿠키 정책</FooterLink>
            <FooterLink href="/authors">가상 저자 안내</FooterLink>
          </FooterCol>
        </div>

        {/* Bottom */}
        <div
          className="flex flex-wrap gap-3 items-center justify-between py-[22px]"
          style={{ borderTop: "1px solid var(--color-forest-700)" }}
        >
          <p
            className="text-[12.5px] leading-[1.6]"
            style={{ color: "var(--color-forest-300)" }}
          >
            © 2026 캠핑고고 · 콘텐츠는 편집팀이 작성하고 AI 보조가 사용됩니다
            · 가상 페르소나는 실재 인물이 아닙니다.
          </p>
          <span
            className="text-[12px] px-2.5 py-1 rounded"
            style={{
              color: "var(--color-forest-300)",
              background: "var(--color-forest-700)",
            }}
          >
            출처: data.go.kr (공공누리 제1유형) · 한국관광공사 고캠핑
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4
        className="text-[13px] font-bold tracking-[0.03em] mb-3.5 text-white"
      >
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5 list-none">
        {children}
      </ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[13.5px] no-underline hover:text-white hover:underline transition-colors"
        style={{ color: "var(--color-forest-200)" }}
      >
        {children}
      </Link>
    </li>
  );
}
