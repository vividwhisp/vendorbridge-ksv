"use client";

import { isImageUrl } from "../../lib/storage";

type Props = {
  url?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
};

const SIZE_MAP = {
  xs: "w-6 h-6",
  sm: "w-9 h-9",
  md: "w-14 h-14",
} as const;

const ICON_SIZE = {
  xs: 12,
  sm: 16,
  md: 22,
} as const;

export function ImagePreview({ url, size = "sm", className = "" }: Props) {
  if (!url) return null;
  const dim = SIZE_MAP[size];

  if (isImageUrl(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={`${dim} rounded-md border border-border object-cover bg-bg flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-md border border-border bg-bg flex items-center justify-center text-muted flex-shrink-0 ${className}`}
      title={url}
    >
      <svg
        width={ICON_SIZE[size]}
        height={ICON_SIZE[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  );
}
