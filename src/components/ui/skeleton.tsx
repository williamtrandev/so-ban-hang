"use client";

import { useId } from "react";
import { AsciiSkeleton } from "ascii-reveal";
import { cn } from "@/lib/utils";

// Skeleton bằng ký tự ░▒▓█ (ascii-reveal, kiểu dither) thay khối xám nhấp nháy.
// Kích thước vẫn lấy từ className như trước (h-*, w-*, rounded-*); số hàng ký tự
// dư ra bị cắt, nên khối cao thấp nào cũng được phủ kín.
function Skeleton({ className, seed }: { className?: string; seed?: number }) {
  // Mỗi khối một mẫu ký tự khác nhau; useId giống nhau giữa server và client.
  const id = useId();
  const autoSeed = [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
  return (
    <AsciiSkeleton
      variant="dither"
      rows={40}
      width="100%"
      height="100%"
      seed={seed ?? autoSeed}
      data-slot="skeleton"
      className={cn("overflow-hidden rounded-md", className)}
    />
  );
}

export { Skeleton };
