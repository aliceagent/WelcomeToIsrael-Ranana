import type { ReactNode } from "react";

type GlyphProps = {
  filled?: boolean;
  size?: number;
};

function Svg({
  size = 28,
  filled,
  children,
  strokeWidth,
}: {
  size?: number;
  filled?: boolean;
  children: ReactNode;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth ?? (filled ? 1.4 : 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ filled, size }: GlyphProps) {
  return (
    <Svg size={size} filled={filled}>
      <path d="M4 10.6 12 4l8 6.6V20a1.2 1.2 0 0 1-1.2 1.2h-5.1v-6.3h-3.4v6.3H5.2A1.2 1.2 0 0 1 4 20v-9.4Z" />
    </Svg>
  );
}

export function FoodIcon({ filled, size }: GlyphProps) {
  return (
    <Svg size={size} filled={filled}>
      <path d="M4.4 11.2h15.2a7.6 7.6 0 0 1-15.2 0Z" />
      <path d="M8.4 4.2c0 1.7 1.2 2.8 3.6 2.8s3.6-1.1 3.6-2.8" fill="none" />
    </Svg>
  );
}

export function AskIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d="M12 3.2 13.4 8.4 18.6 9.8 13.4 11.2 12 16.4 10.6 11.2 5.4 9.8 10.6 8.4 12 3.2Z" />
      <path d="M19 15.2 19.7 17.4 22 18.1 19.7 18.8 19 21 18.3 18.8 16 18.1 18.3 17.4 19 15.2Z" />
    </svg>
  );
}

export function SearchIcon({ filled, size = 28 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={filled ? 2.6 : 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <circle cx="10.75" cy="10.75" r="6.6" />
      <path d="m15.8 15.8 5 5" />
    </svg>
  );
}

export function SavedIcon({ filled, size }: GlyphProps) {
  return (
    <Svg size={size} filled={filled}>
      <path d="M12 3.1 14.7 8.8l6.3.9-4.6 4.4 1.1 6.2L12 17.4 6.5 20.3l1.1-6.2-4.6-4.4 6.3-.9L12 3.1Z" />
    </Svg>
  );
}

export function SosIcon({ filled, size = 28 }: GlyphProps) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M8 3.6h8A4.4 4.4 0 0 1 20.4 8v8A4.4 4.4 0 0 1 16 20.4H8A4.4 4.4 0 0 1 3.6 16V8A4.4 4.4 0 0 1 8 3.6Zm4 3.6a1.15 1.15 0 0 0-1.15 1.15v2.5H8.35a1.15 1.15 0 1 0 0 2.3h2.5v2.5a1.15 1.15 0 0 0 2.3 0v-2.5h2.5a1.15 1.15 0 0 0 0-2.3h-2.5v-2.5A1.15 1.15 0 0 0 12 7.2Z"
        />
      </svg>
    );
  }
  return (
    <Svg size={size}>
      <rect x="4" y="4" width="16" height="16" rx="4.2" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </Svg>
  );
}
