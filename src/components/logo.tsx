import { cn } from "@/lib/utils";

// Cùng hình với public/logo.svg (nguồn sinh icon app/favicon/splash). Nền vẽ
// bằng CSS gradient thay vì <linearGradient id> để nhiều logo trên 1 trang
// (kể cả bản đang bị ẩn) không đụng id của nhau.
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-8 shrink-0 overflow-hidden rounded-[22%] bg-[linear-gradient(135deg,#33a463,#005e37)]",
        className,
      )}
    >
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255/0.16),transparent_55%)]" />
      <svg viewBox="0 0 512 512" className="relative size-full">
        <g
          transform="translate(266 246) scale(1.12) translate(-256 -256)"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M146 366C146 222 224 146 370 146C370 290 290 366 146 366Z" fill="#f3f9f1" />
          <path d="M150 362L114 398" stroke="#f3f9f1" strokeWidth="18" />
          <path d="M178 334C226 286 284 228 338 174" stroke="#007e48" strokeWidth="13" />
          <path
            d="M226 286C218 262 220 240 232 220M226 286C250 294 272 292 292 280M276 236C270 216 272 198 282 182M276 236C296 242 314 240 330 230"
            stroke="#007e48"
            strokeWidth="11"
          />
        </g>
      </svg>
    </span>
  );
}
