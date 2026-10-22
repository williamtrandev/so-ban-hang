"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

// Cùng hình với public/logo.svg (nguồn sinh icon app/favicon/splash).
// useId: nhiều logo trên 1 trang (kể cả bản đang ẩn) không đụng id gradient.
export function Logo({ className }: { className?: string }) {
  const id = useId();
  const bg = `${id}-bg`;
  const leaf = `${id}-leaf`;

  return (
    <svg viewBox="0 0 512 512" aria-hidden className={cn("size-8 shrink-0", className)}>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf5e6" />
          <stop offset="1" stopColor="#f0e4ca" />
        </linearGradient>
        <linearGradient id={leaf} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fae62" />
          <stop offset="1" stopColor="#16804a" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${bg})`} />
      <g transform="translate(-6 10) rotate(-30 256 256)">
        <rect x="166" y="174" width="232" height="164" rx="82" fill={`url(#${leaf})`} />
        <path
          d="M214 204C276 199 330 199 372 208M206 256H388M214 308C276 313 330 313 372 304"
          stroke="#0f6b3d"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity=".55"
        />
        <path d="M254 172V340M326 176V336" stroke="#c9463d" strokeWidth="16" strokeLinecap="round" />
        <ellipse cx="166" cy="256" rx="60" ry="82" fill="#0f6b3d" />
        <ellipse cx="166" cy="256" rx="47" ry="67" fill="#f4cfc2" />
        <ellipse cx="160" cy="246" rx="22" ry="30" fill="#f9e2d8" />
      </g>
    </svg>
  );
}
