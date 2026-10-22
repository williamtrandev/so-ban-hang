/* eslint-disable @next/next/no-img-element */
// Splash hiển thị tức thì khi mở app (fallback của Suspense ở root layout),
// trong lúc (app)/layout còn chờ auth + profile phía server.
// Markup tĩnh thuần server: stream ngay trong HTML đầu tiên, không cần JS.
// Khớp từng pixel với ảnh khởi động iOS (scripts/generate-splash.mjs): nền
// #0a0a0a, logo 24% cạnh ngắn ở chính giữa -> chuyển từ ảnh native
// sang HTML không bị nháy hay nhảy vị trí.
export function SplashScreen() {
  return (
    <div
      aria-label="Đang mở ứng dụng"
      role="status"
      className="fixed inset-0 z-50 bg-[#0a0a0a] text-white"
    >
      <div className="absolute top-1/2 left-1/2 size-[24vmin] -translate-x-1/2 -translate-y-1/2">
        <img src="/icons/icon-512.png" alt="" className="size-full" />
      </div>

      <div className="absolute inset-x-0 top-[calc(50%+12vmin+2rem)] flex flex-col items-center gap-3">
        <div className="flex items-center gap-1.5 animate-in fade-in duration-300 [animation-delay:400ms] [animation-fill-mode:backwards] motion-reduce:hidden">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-white/70"
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </div>
        <p className="px-6 text-center text-xs text-white/55 animate-in fade-in duration-500 [animation-delay:4s] [animation-fill-mode:backwards]">
          Mạng hơi chậm, chờ chút nhé…
        </p>
      </div>
      <p className="sr-only">Đang tải dữ liệu...</p>
    </div>
  );
}
