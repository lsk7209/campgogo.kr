const BASE_URL = "https://campgogo.kr";

export function buildArticleJsonLd(params: {
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  url: string;
  authorName: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    datePublished: params.datePublished,
    dateModified: params.dateModified,
    url: params.url,
    author: { "@type": "Person", name: params.authorName },
    publisher: { "@type": "Organization", name: "캠핑고고", url: BASE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": params.url },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildLocalBusinessJsonLd(params: {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  url: string;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: params.name,
    address: { "@type": "PostalAddress", streetAddress: params.address, addressCountry: "KR" },
    geo: { "@type": "GeoCoordinates", latitude: params.lat, longitude: params.lng },
    url: params.url,
  };
  if (params.phone) result.telephone = params.phone;
  return result;
}

export function buildPlaceJsonLd(params: {
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  url: string;
  image?: string;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: params.name,
    address: { "@type": "PostalAddress", streetAddress: params.address, addressCountry: "KR" },
    geo: { "@type": "GeoCoordinates", latitude: params.lat, longitude: params.lng },
    url: params.url,
  };
  if (params.description) result.description = params.description;
  if (params.image) result.image = params.image;
  return result;
}

export function buildFAQJsonLd(
  faqs: Array<{ q: string; a: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}
