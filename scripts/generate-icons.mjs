// Sinh mọi icon từ public/logo.svg. Chạy lại khi đổi logo:
//   node scripts/generate-icons.mjs && node scripts/generate-splash.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile("public/logo.svg", "utf8");

// Bản tràn viền (bỏ bo góc): iOS/Android tự cắt mask, góc trong suốt sẽ thành
// viền đen/trắng xấu. scale < 1 để hình nằm trong vùng an toàn của maskable.
const fullBleed = (scale) =>
  svg
    .replace(/(<rect id="tile"[^>]*?) rx="\d+"/, "$1")
    .replace('<g id="mark">', `<g id="mark" transform="translate(256 256) scale(${scale}) translate(-256 -256)">`);

const jobs = [
  [svg, 192, "public/icons/icon-192.png"],
  [svg, 512, "public/icons/icon-512.png"],
  [svg, 192, "src/app/icon.png"],
  [fullBleed(0.82), 512, "public/icons/icon-512-maskable.png"],
  [fullBleed(1), 180, "src/app/apple-icon.png"],
];

for (const [source, size, out] of jobs) {
  await sharp(Buffer.from(source), { density: 384 }).resize(size, size).png().toFile(out);
  console.log(out);
}
