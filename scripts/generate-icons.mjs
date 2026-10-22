// Sinh mọi icon từ public/logo.svg. Chạy lại khi đổi logo:
//   node scripts/generate-icons.mjs && node scripts/generate-splash.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile("public/logo.svg", "utf8");

// Bản tràn viền (không bo góc, không nền trong suốt): iOS/Android tự cắt mask,
// góc trong suốt sẽ thành viền đen/trắng xấu.
const fullBleed = (glyphScale) =>
  svg
    .replace(/ rx="112"/g, "")
    .replace(/scale\(1\.12\)/, `scale(${glyphScale})`)
    .replace("translate(266 246)", "translate(261 251)");

const jobs = [
  [svg, 192, "public/icons/icon-192.png"],
  [svg, 512, "public/icons/icon-512.png"],
  [svg, 192, "src/app/icon.png"],
  // Maskable: nội dung nằm trong vùng an toàn 80% đường kính.
  [fullBleed(0.86), 512, "public/icons/icon-512-maskable.png"],
  [fullBleed(1.0), 180, "src/app/apple-icon.png"],
];

for (const [source, size, out] of jobs) {
  await sharp(Buffer.from(source), { density: 384 }).resize(size, size).png().toFile(out);
  console.log(out);
}
