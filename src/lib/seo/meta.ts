import type { Metadata } from "next";

const SITE_NAME = "캠핑고고";
const BASE_URL = process.env.SITE_URL ?? "https://campgogo.kr";

export function buildCampsiteMeta(campsite: {
  name: string;
  sido: string;
  gungu?: string | null;
  address?: string | null;
  price1Night?: number | null;
  isPublic?: boolean | null;
  isChabak?: boolean | null;
  slug?: string | null;
}, pageTitle?: string): Metadata {
  const region = campsite.gungu ? `${campsite.sido} ${campsite.gungu}` : campsite.sido;
  const tags: string[] = [];
  if (campsite.isPublic) tags.push("공공야영지");
  if (campsite.isChabak) tags.push("차박 가능");
  if (campsite.price1Night === 0) tags.push("무료");
  else if (campsite.price1Night != null && campsite.price1Night <= 10000) tags.push("저렴한 야영지");

  const tagStr = tags.length > 0 ? ` · ${tags.join(" · ")}` : "";
  const title = `${campsite.name} — ${region} 야영지 정보${tagStr} | ${SITE_NAME}`;

  const priceStr =
    campsite.price1Night != null
      ? campsite.price1Night === 0
        ? "무료"
        : `1박 ${campsite.price1Night.toLocaleString("ko-KR")}원~`
      : "";

  const description = [
    `${region} 위치한 ${campsite.name} 야영지 상세 정보.`,
    priceStr ? `이용 요금 ${priceStr}.` : "",
    campsite.address ? `주소: ${campsite.address}.` : "",
    "시설·예약·주변 관광지 안내.",
  ]
    .filter(Boolean)
    .join(" ");

  const ogTitle = pageTitle ?? campsite.name;
  const ogImageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(ogTitle)}&subtitle=${encodeURIComponent(region + " 야영지")}`;
  const canonical = campsite.slug ? `${BASE_URL}/캠핑장/${campsite.slug}` : undefined;

  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
  };
}

export function buildBlogMeta(post: {
  title: string;
  slug: string;
  metaDescription?: string | null;
  datePublished?: string | null;
}): Metadata {
  const title = `${post.title} | ${SITE_NAME}`;
  const description = post.metaDescription ?? `캠핑고고 블로그: ${post.title}. 야영지 정보와 캠핑 팁.`;
  const canonical = `${BASE_URL}/blog/${post.slug}`;
  const ogImageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent("캠핑고고 블로그")}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "article",
      publishedTime: post.datePublished ?? undefined,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
  };
}

export function buildRegionMeta(sido: string, count: number, gungu?: string): Metadata {
  const regionLabel = gungu ? `${sido} ${gungu}` : sido;
  const title = `${regionLabel} 야영지 ${count}곳 모음 | ${SITE_NAME}`;
  const description = `${regionLabel} 지역 야영지 ${count}곳 정보. 공공야영지·차박·저렴한 캠핑장 비교.`;
  const canonicalPath = gungu
    ? `/지역/${encodeURIComponent(sido)}/${encodeURIComponent(gungu)}`
    : `/지역/${encodeURIComponent(sido)}`;
  const canonical = `${BASE_URL}${canonicalPath}`;
  const ogImageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(regionLabel + " 야영지")}&subtitle=${encodeURIComponent(count + "곳 정보")}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
  };
}
