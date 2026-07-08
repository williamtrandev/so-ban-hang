// Sinh ảnh splash iOS (apple-touch-startup-image) cho từng size máy.
// Nền tối #0a0a0a khớp manifest background_color, icon bo góc đặt giữa.
// Chạy lại khi đổi icon: node scripts/generate-splash.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const BG = "#0a0a0a";
const ICON = "public/icons/icon-512.png";
const OUT_DIR = "public/splash";

// [cssWidth, cssHeight, pixelRatio] — portrait, danh sách iPhone/iPad hiện hành.
export const DEVICES = [
  [320, 568, 2], // iPhone SE 1
  [375, 667, 2], // iPhone 6/7/8/SE 2-3
  [414, 736, 3], // iPhone 6+/7+/8+
  [375, 812, 3], // iPhone X/XS/11 Pro/12-13 mini
  [414, 896, 2], // iPhone XR/11
  [414, 896, 3], // iPhone XS Max/11 Pro Max
  [390, 844, 3], // iPhone 12/13/14
  [393, 852, 3], // iPhone 14 Pro/15/16
  [402, 874, 3], // iPhone 16 Pro
  [428, 926, 3], // iPhone 12-13 Pro Max/14 Plus
  [430, 932, 3], // iPhone 14 Pro Max/15 Plus-Pro Max/16 Plus
  [440, 956, 3], // iPhone 16 Pro Max
  [768, 1024, 2], // iPad 9.7"
  [820, 1180, 2], // iPad 10.9"
  [834, 1194, 2], // iPad Pro 11"
  [1024, 1366, 2], // iPad Pro 12.9"
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const [w, h, r] of DEVICES) {
    const W = w * r;
    const H = h * r;
    // Icon ~24% cạnh ngắn, bo góc kiểu iOS (~22% radius).
    const size = Math.round(Math.min(W, H) * 0.24);
    const radius = Math.round(size * 0.22);

    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`,
    );
    const icon = await sharp(ICON)
      .resize(size, size)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();

    // Icon nền tối trên splash tối sẽ lẫn nền: thêm ring mờ để tách khối.
    const ring = Buffer.from(
      `<svg width="${size + 8}" height="${size + 8}"><rect x="1" y="1" width="${size + 6}" height="${size + 6}" rx="${radius + 3}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2"/></svg>`,
    );

    const file = `${OUT_DIR}/splash-${W}x${H}.png`;
    await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
      .composite([
        { input: icon, gravity: "center" },
        { input: ring, gravity: "center" },
      ])
      .png()
      .toFile(file);
    console.log(file);
  }
}

main();
