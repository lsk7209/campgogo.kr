import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MatchingTool } from "@/components/tools/matching-tool";

export const metadata: Metadata = {
  title: "내 조건으로 야영지 찾기",
  description: "테마 예산 차박 합법성 출발지로 야영지를 검색합니다.",
};

export default function MatchPage() {
  return (
    <>
      <SiteHeader activeNav="/match" />
      <main className="flex-1"><MatchingTool /></main>
      <SiteFooter />
    </>
  );
}
