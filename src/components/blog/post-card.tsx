"use client";

import Link from "next/link";

export type ThumbVariant = "forest" | "sunset" | "soil" | "sky";

const thumbGradients: Record<ThumbVariant, string> = {
  forest: "linear-gradient(135deg, #4C7361, #244033)",
  sunset: "linear-gradient(135deg, #D88758, #B5612F)",
  soil: "linear-gradient(135deg, #A98A5E, #6E5736)",
  sky: "linear-gradient(135deg, #7BA3C7, #4E7799)",
};

export interface PostCardProps {
  href: string;
  title: string;
  excerpt?: string;
  category: string;
  date: string;
  readTime: string;
  author?: string;
  thumb: ThumbVariant;
  variant?: "default" | "hero" | "side";
}

export function PostCard({
  href,
  title,
  excerpt,
  category,
  date,
  readTime,
  author,
  thumb,
  variant = "default",
}: PostCardProps) {
  const isHero = variant === "hero";
  const isSide = variant === "side";

  return (
    <Link
      href={href}
      className="post-card group flex flex-col bg-white border overflow-hidden no-underline transition-all duration-150 hover:-translate-y-[3px] hover:shadow-md"
      style={{
        borderColor: "var(--color-gray-200)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {isSide ? (
        <div className="side-card-grid h-full">
          <div
            className="relative flex items-end min-h-[100px]"
            style={{ background: thumbGradients[thumb] }}
          >
            <span className="text-[11.5px] font-semibold tracking-[0.04em] text-white/55 absolute inset-0 flex items-center justify-center">
              [ 사진 ]
            </span>
          </div>
          <div className="flex flex-col p-4">
            <h3
              className="font-bold leading-[1.5] tracking-[-0.01em] line-clamp-2 text-[16px]"
              style={{ color: "var(--color-gray-900)" }}
            >
              {title}
            </h3>
            <PostMeta date={date} readTime={readTime} author={author} />
          </div>
        </div>
      ) : (
        <>
          <div
            className="relative flex items-end"
            style={{
              background: thumbGradients[thumb],
              aspectRatio: isHero ? "16/11" : "16/10",
            }}
          >
            <span
              className="absolute top-3 left-3 text-[12px] font-bold px-2.5 py-1 rounded bg-white/95"
              style={{ color: "var(--color-gray-800)" }}
            >
              {category}
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-[11.5px] font-semibold tracking-[0.04em] text-white/55">
              [ 대표 이미지 — 실제 사진으로 교체 ]
            </span>
          </div>

          <div
            className="flex flex-col flex-1"
            style={{ padding: isHero ? "22px 24px 24px" : "16px 18px 18px" }}
          >
            <h3
              className="font-bold leading-[1.5] tracking-[-0.01em] line-clamp-2"
              style={{
                fontSize: isHero ? "24px" : "17px",
                color: "var(--color-gray-900)",
                WebkitLineClamp: isHero ? 3 : 2,
              }}
            >
              {title}
            </h3>
            {excerpt && (
              <p
                className="mt-2 leading-[1.6] line-clamp-2"
                style={{
                  fontSize: isHero ? "15px" : "14px",
                  color: "var(--color-gray-600)",
                  WebkitLineClamp: isHero ? 3 : 2,
                }}
              >
                {excerpt}
              </p>
            )}
            <PostMeta
              date={date}
              readTime={readTime}
              author={author}
              className="mt-auto"
            />
          </div>
        </>
      )}
    </Link>
  );
}

function PostMeta({
  date,
  readTime,
  author,
  className,
}: {
  date: string;
  readTime: string;
  author?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 mt-3.5 pt-3 ${className ?? ""}`}
      style={{
        borderTop: "1px solid var(--color-gray-100)",
        fontSize: "12.5px",
        color: "var(--color-gray-500)",
      }}
    >
      <span>{date}</span>
      <Dot />
      <span>{readTime}</span>
      {author && (
        <>
          <Dot />
          <span>{author}</span>
        </>
      )}
    </div>
  );
}

function Dot() {
  return (
    <span
      className="inline-block w-[3px] h-[3px] rounded-full flex-none"
      style={{ background: "var(--color-gray-300)" }}
    />
  );
}
