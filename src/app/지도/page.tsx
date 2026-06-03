import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MapView } from "@/components/tools/map-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "야영지 지도",
  description: "전국 공공·차박 야영지를 지도로 찾아보세요.",
};

export default function MapPage() {
  return (
    <>
      <SiteHeader activeNav="/지도" />
      <main className="flex-1">
        <MapView />
      </main>
      <SiteFooter />
    </>
  );
}
