// Ảnh + chữ "thanh toán đơn" để gửi khách qua Zalo/Messenger.

export interface PaymentShareInfo {
  buyer: string;
  amount: number;
  bankName: string;
  accountLabel: string;
  account: string;
  accountName: string | null;
  items: string[];
}

const fmt = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

export function paymentText(p: PaymentShareInfo): string {
  return [
    `Thanh toán đơn: ${p.buyer}`,
    ...p.items,
    `Số tiền: ${fmt(p.amount)}`,
    "",
    `Ngân hàng: ${p.bankName}`,
    `${p.accountLabel}: ${p.account}`,
    ...(p.accountName ? [`Chủ tài khoản: ${p.accountName}`] : []),
  ].join("\n");
}

function loadSvg(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  return img.decode().then(() => img);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Thẻ dọc 360 x (tuỳ số dòng), vẽ ở 2x cho nét: tên khách, QR, số tiền, món, tài khoản.
export async function paymentImage(qrSvg: SVGSVGElement, p: PaymentShareInfo): Promise<Blob> {
  const qr = await loadSvg(qrSvg);
  const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  const S = 2;
  const W = 360;
  const pad = 24;
  const qrSize = 232;
  const itemH = 20;
  const H = 128 + qrSize + 70 + p.items.length * itemH + 78 + (p.accountName ? 0 : -24);

  const canvas = document.createElement("canvas");
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(S, S);

  ctx.fillStyle = "#f4f8f5";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 12, 12, W - 24, H - 24, 20);
  ctx.fill();

  let y = 12 + pad + 8;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = "#5f6b64";
  ctx.font = `500 13px ${font}`;
  ctx.fillText("Thanh toán đơn hàng", W / 2, y);
  y += 26;
  ctx.fillStyle = "#1b2620";
  ctx.font = `600 20px ${font}`;
  ctx.fillText(p.buyer, W / 2, y, W - 2 * pad - 24);
  y += 18;

  const qx = (W - qrSize) / 2;
  ctx.drawImage(qr, qx, y, qrSize, qrSize);
  y += qrSize + 34;

  ctx.fillStyle = "#007842";
  ctx.font = `700 28px ${font}`;
  ctx.fillText(fmt(p.amount), W / 2, y);
  y += 14;

  ctx.textAlign = "left";
  ctx.fillStyle = "#5f6b64";
  ctx.font = `400 13px ${font}`;
  for (const line of p.items) {
    y += itemH;
    ctx.fillText(line.replace(/^- /, "• "), 12 + pad + 8, y);
  }

  y += 22;
  ctx.fillStyle = "#e3ebe6";
  ctx.fillRect(12 + pad, y, W - 24 - 2 * pad, 1);
  y += 26;

  const row = (label: string, value: string, bold = false) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "#5f6b64";
    ctx.font = `400 13px ${font}`;
    ctx.fillText(label, 12 + pad, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#1b2620";
    ctx.font = `${bold ? 600 : 500} 14px ${font}`;
    ctx.fillText(value, W - 12 - pad, y, 200);
    y += 24;
  };
  row("Ngân hàng", p.bankName);
  row(p.accountLabel, p.account, true);
  if (p.accountName) row("Chủ tài khoản", p.accountName.toUpperCase());

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}
