import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
  activeNav?: string;
}

export function StaticPageLayout({
  title,
  subtitle,
  lastUpdated,
  children,
  activeNav,
}: StaticPageLayoutProps) {
  return (
    <>
      <SiteHeader activeNav={activeNav} />
      <main className="max-w-[760px] mx-auto px-6 py-12 flex-1">
        <header className="mb-10 pb-8" style={{ borderBottom: "1px solid var(--color-gray-200)" }}>
          <h1
            className="text-[32px] font-extrabold tracking-[-0.02em] leading-tight mb-3"
            style={{ color: "var(--color-forest-800)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[16px] leading-[1.7]" style={{ color: "var(--color-gray-600)" }}>
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <p className="text-[13px] mt-3" style={{ color: "var(--color-gray-400)" }}>
              최종 업데이트: {lastUpdated}
            </p>
          )}
        </header>
        <div className="prose-campgogo">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
