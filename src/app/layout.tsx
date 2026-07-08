import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/sw-register";
import { GrainOverlay } from "@/components/grain-overlay";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// [cssWidth, cssHeight, pixelRatio] — khớp scripts/generate-splash.mjs.
// iOS chỉ hiện splash khi có ảnh đúng size màn hình + media query tương ứng.
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
    startupImage: SPLASH_DEVICES.map(([w, h, r]) => ({
      url: `/splash/splash-${w * r}x${h * r}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Áp class .dark trước khi paint để không nháy sai theme (đọc localStorage, fallback hệ thống).
const THEME_INIT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
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
