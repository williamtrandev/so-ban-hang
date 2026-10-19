// Parser cho tính năng nhập nhanh nhiều đơn dạng text.
// Mỗi dòng = 1 đơn. Cột ngăn bởi dấu phẩy HOẶC tab (paste thẳng từ Excel/Sheets).
// Cột đầu = tên người mua. Các cột sau KHÔNG theo thứ tự cố định, mỗi cột là 1 token:
//   <số><đơn vị>. Nem và bì có 2 loại đóng gói: l = lá, h = hộp.
//     nl  = nem ăn liền lá     nh  = nem ăn liền hộp
//     nml = nem mới lá         nmh = nem mới hộp
//     bl  = bì lá              bh  = bì hộp
//     c   = chả
//     cc  = chuối chiên        kl  = khoai lang chiên
//   token trạng thái: "tt" = đã thanh toán, "giao" = đã giao
//   còn lại = ghi chú
// Ví dụ: "Cô Bảy chợ Xổm, 2nl, 1nmh, 1bl, 1c, 2cc, 1kl, tt, giao, gói riêng"
// Dùng chung cho client (preview) và server (validate + insert).

import { zeroSoLuong, type SoLuong } from "@/lib/domain/types";

export type ParsedOrder = SoLuong & {
  ten_nguoi_mua: string;
  ghi_chu: string | null;
  da_thanh_toan: boolean;
  da_giao: boolean;
};

export type ParseLineResult =
  | { ok: true; line: number; raw: string; order: ParsedOrder }
  | { ok: false; line: number; raw: string; error: string };

export const PAID_TOKENS = new Set(["tt", "đã tt", "thanh toán", "đã thanh toán", "paid"]);
export const DELIVERED_TOKENS = new Set(["giao", "đã giao", "delivered", "ship"]);

// Đơn vị dài (nml/nmh, cc) đứng trước đơn vị ngắn (nl/nh, c) để khớp đúng.
export const QTY_RE = /^(\d+)\s*(nml|nmh|nl|nh|bl|bh|cc|kl|c)$/i;

export const QTY_FIELD = {
  nl: "so_luong_nem_an_lien_la",
  nh: "so_luong_nem_an_lien_hop",
  nml: "so_luong_nem_moi_la",
  nmh: "so_luong_nem_moi_hop",
  bl: "so_luong_bi_la",
  bh: "so_luong_bi_hop",
  c: "so_luong_cha",
  cc: "so_luong_chuoi_chien",
  kl: "so_luong_khoai_lang_chien",
} as const satisfies Record<string, keyof SoLuong>;

export function parseBulkOrders(text: string): ParseLineResult[] {
  const results: ParseLineResult[] = [];
  const lines = text.split(/\r\n|\r|\n/);

  lines.forEach((raw, i) => {
    if (raw.trim() === "") return; // bỏ dòng trống, không tính là lỗi
    const line = i + 1;
    // Excel/Sheets paste dùng tab; nhập tay dùng dấu phẩy. Ưu tiên tab nếu có.
    const parts = raw.includes("\t") ? raw.split("\t") : raw.split(",");
    const ten_nguoi_mua = (parts[0] ?? "").trim();

    if (!ten_nguoi_mua) {
      results.push({ ok: false, line, raw, error: "Thiếu tên người mua." });
      return;
    }

    const qty = zeroSoLuong();
    let da_thanh_toan = false;
    let da_giao = false;
    const noteParts: string[] = [];

    for (const part of parts.slice(1)) {
      const t = part.trim();
      if (t === "") continue;
      const key = t.toLowerCase();
      const m = QTY_RE.exec(t);
      if (m) {
        const unit = m[2].toLowerCase() as keyof typeof QTY_FIELD;
        qty[QTY_FIELD[unit]] += parseInt(m[1], 10);
      } else if (PAID_TOKENS.has(key)) {
        da_thanh_toan = true;
      } else if (DELIVERED_TOKENS.has(key)) {
        da_giao = true;
      } else {
        noteParts.push(t);
      }
    }

    const coSoLuong = Object.values(qty).some((n) => n > 0);
    if (!coSoLuong) {
      results.push({
        ok: false,
        line,
        raw,
        error: "Cần ít nhất 1 số lượng (vd: 2nl, 1nmh, 1bl, 1c, 2cc, 1kl).",
      });
      return;
    }

    results.push({
      ok: true,
      line,
      raw,
      order: {
        ten_nguoi_mua,
        ...qty,
        ghi_chu: noteParts.length > 0 ? noteParts.join(", ") : null,
        da_thanh_toan,
        da_giao,
      },
    });
  });

  return results;
}

// ---- Sửa text nhập nhanh bằng nút bấm (khỏi phải gõ mã trên điện thoại) ----

export type QtyCode = keyof typeof QTY_FIELD;

function splitQuick(text: string) {
  const [name = "", ...rest] = text.split(",");
  return { name: name.trim(), tokens: rest.map((t) => t.trim()).filter(Boolean) };
}

function joinQuick(name: string, tokens: string[]) {
  return [name, ...tokens].join(", ");
}

// Số lượng từng mã + trạng thái đang có trong 1 dòng nhập nhanh.
export function quickTokenState(text: string) {
  const { tokens } = splitQuick(text);
  const qty: Partial<Record<QtyCode, number>> = {};
  let paid = false;
  let delivered = false;
  for (const t of tokens) {
    const m = QTY_RE.exec(t);
    if (m) {
      const code = m[2].toLowerCase() as QtyCode;
      qty[code] = (qty[code] ?? 0) + parseInt(m[1], 10);
    } else if (PAID_TOKENS.has(t.toLowerCase())) paid = true;
    else if (DELIVERED_TOKENS.has(t.toLowerCase())) delivered = true;
  }
  return { qty, paid, delivered };
}

// Cộng/trừ 1 mã: gộp mọi token cùng mã thành 1, về 0 thì bỏ hẳn. Token mới
// chèn sau token số lượng cuối cùng để trạng thái/ghi chú vẫn nằm cuối dòng.
export function bumpQuickQty(text: string, code: QtyCode, delta: number): string {
  const { name, tokens } = splitQuick(text);
  const total = Math.max(0, (quickTokenState(text).qty[code] ?? 0) + delta);
  const out: string[] = [];
  let placed = false;
  let lastQty = -1;
  for (const t of tokens) {
    const m = QTY_RE.exec(t);
    if (m && m[2].toLowerCase() === code) {
      if (!placed && total > 0) out.push(`${total}${code}`);
      placed = true;
      continue;
    }
    out.push(t);
    if (m) lastQty = out.length - 1;
  }
  if (!placed && total > 0) out.splice(lastQty + 1, 0, `${total}${code}`);
  return joinQuick(name, out);
}

export function toggleQuickStatus(text: string, kind: "paid" | "delivered"): string {
  const { name, tokens } = splitQuick(text);
  const set = kind === "paid" ? PAID_TOKENS : DELIVERED_TOKENS;
  const kept = tokens.filter((t) => !set.has(t.toLowerCase()));
  if (kept.length === tokens.length) kept.push(kind === "paid" ? "tt" : "giao");
  return joinQuick(name, kept);
}
