import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/sw-register";
import { GrainOverlay } from "@/components/grain-overlay";
import { SplashScreen } from "@/components/splash-screen";
import { THEME_COLOR, THEME_INIT_SCRIPT } from "@/lib/theme-init";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// [cssWidth, cssHeight, pixelRatio] — kích thước logic theo chiều dọc, khớp
// scripts/generate-splash.mjs. iOS cần khai báo CẢ 2 orientation cho mỗi máy,
// thiếu hướng nào thì hướng đó không hiện splash.
const SPLASH_DEVICES: [number, number, number][] = [
  [320, 568, 2],
  [375, 667, 2],
  [414, 736, 3],
  [375, 812, 3],
  [414, 896, 2],
  [414, 896, 3],
  [390, 844, 3],
  [393, 852, 3],
  [402, 874, 3],
  [420, 912, 3],
  [428, 926, 3],
  [430, 932, 3],
  [440, 956, 3],
  [768, 1024, 2],
  [820, 1180, 2],
  [834, 1194, 2],
  [1024, 1366, 2],
];

export const metadata: Metadata = {
  title: "Sổ bán nem, bì, chả",
  description: "Quản lý bán nem, bì, chả lụa và quyết toán theo đợt",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sổ bán hàng",
    // Ảnh khởi động theo chế độ sáng/tối của máy (iOS chưa biết theme chọn trong app).
    startupImage: SPLASH_DEVICES.flatMap(([w, h, r]) =>
      (["light", "dark"] as const).flatMap((scheme) => {
        const prefix = scheme === "light" ? "splash-light" : "splash";
        const device = `screen and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r})`;
        return [
          {
            url: `/splash/${prefix}-${w * r}x${h * r}.png`,
            media: `${device} and (orientation: portrait) and (prefers-color-scheme: ${scheme})`,
          },
          {
            url: `/splash/${prefix}-${h * r}x${w * r}.png`,
            media: `${device} and (orientation: landscape) and (prefers-color-scheme: ${scheme})`,
          },
        ];
      }),
    ),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <GrainOverlay />
        {/* Root layout sync -> stream ngay; splash hiện tức thì trong lúc
            (app)/layout chờ auth + profile phía server (nguyên nhân màn đen cũ). */}
        <Suspense fallback={<SplashScreen />}>{children}</Suspense>
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
