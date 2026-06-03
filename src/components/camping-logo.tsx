import Link from "next/link";

interface CampingLogoProps {
  inverted?: boolean;
}

export function CampingLogo({ inverted }: CampingLogoProps) {
  return (
    <Link href="/" aria-label="캠핑고고 홈" className="inline-flex items-center gap-2.5 no-underline">
      <svg
        className="w-[30px] h-[30px] flex-none"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        {inverted ? (
          <>
            <path d="M16 4 L29 27 L3 27 Z" fill="#F1F7F4" />
            <path d="M16 13 L22 27 L10 27 Z" fill="#244033" />
            <path d="M16 4 L19 10 L13 10 Z" fill="#D88758" />
          </>
        ) : (
          <>
            <path d="M16 4 L29 27 L3 27 Z" fill="#2D4A3E" />
            <path d="M16 13 L22 27 L10 27 Z" fill="#F5EFE5" />
            <path d="M16 4 L19 10 L13 10 Z" fill="#C9763E" />
          </>
        )}
      </svg>
      <span
        className="text-[20px] font-extrabold tracking-[-0.02em] leading-none"
      >
        <span style={{ color: inverted ? "#fff" : "var(--color-forest-800)" }}>
          캠핑
        </span>
        <span style={{ color: "var(--color-sunset-600)" }}>고고</span>
      </span>
    </Link>
  );
}
