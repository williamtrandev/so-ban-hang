"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";
import { AsciiReveal } from "ascii-reveal";

// Key theo tab: đổi tab thì trang cũ trượt ra, trang mới trượt vào theo hướng
// tab (nav-forward/nav-back gắn trên Link ở NavBar).
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const types = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };
  return (
    <ViewTransition key={pathname} enter={types} exit={types} default="none">
      {children}
    </ViewTransition>
  );
}

// Bọc skeleton trong loading.tsx và nội dung trang: skeleton mờ đi, nội dung hiện lên.
export function SkeletonTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition exit="vt-fade-out" default="none">
      {children}
    </ViewTransition>
  );
}

// Nội dung trang "giải mã" vào chỗ qua lưới ký tự khi chuyển trang (ascii-reveal).
// Lần tải đầu (HTML từ server) hiện ngay, không chạy hiệu ứng để khỏi chậm.
export function ContentReveal({ children }: { children: React.ReactNode }) {
  return (
    <AsciiReveal preset="decode" duration="fast">
      {children}
    </AsciiReveal>
  );
}
