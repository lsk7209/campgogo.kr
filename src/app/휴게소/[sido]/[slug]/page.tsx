import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamicParams = true;


interface PageProps {
  params: Promise<{ sido: string; slug: string }>;
}

export default async function HyugesoDetailPage(_props: PageProps) {
  notFound();
}
