/* eslint-disable @next/next/no-img-element */
// Splash hiển thị tức thì khi mở app (fallback của Suspense ở root layout),
// trong lúc (app)/layout còn chờ auth + profile phía server.
// Markup tĩnh thuần server: stream ngay trong HTML đầu tiên, không cần JS.
export function SplashScreen() {
  return (
    <div
      aria-label="Đang mở ứng dụng"
      role="status"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background"
    >
      <div className="animate-in fade-in zoom-in-90 duration-500 motion-reduce:animate-none">
        <img
          src="/icons/icon-192.png"
          alt=""
          width={72}
          height={72}
          className="size-18 rounded-2xl shadow-[0_12px_32px_-12px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
        />
      </div>

      <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-500 [animation-delay:120ms] [animation-fill-mode:backwards] motion-reduce:animate-none">
        <p className="font-heading text-lg font-semibold tracking-tight">Sổ bán hàng</p>
        <p className="text-xs text-muted-foreground">Nem, bì, chả lụa</p>
      </div>

      <div
        className="flex items-center gap-1.5 motion-reduce:hidden"
        style={{ animationDelay: "200ms" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      <p className="sr-only">Đang tải dữ liệu...</p>
    </div>
  );
}
