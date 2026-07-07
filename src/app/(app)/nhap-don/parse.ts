// Parser cho tính năng nhập nhanh nhiều đơn dạng text.
// Mỗi dòng = 1 đơn. Cột ngăn bởi dấu phẩy HOẶC tab (paste thẳng từ Excel/Sheets).
// Cột đầu = tên người mua. Các cột sau KHÔNG theo thứ tự cố định, mỗi cột là 1 token:
//   <số><đơn vị>. Nem và bì có 2 loại đóng gói: l = lá, h = hộp.
//     nl  = nem ăn liền lá     nh  = nem ăn liền hộp
//     nml = nem mới lá         nmh = nem mới hộp
//     bl  = bì lá              bh  = bì hộp
//     c   = chả
//   token trạng thái: "tt" = đã thanh toán, "giao" = đã giao
//   còn lại = ghi chú
// Ví dụ: "Cô Bảy chợ Xổm, 2nl, 1nmh, 1bl, 1c, tt, giao, gói riêng"
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

const PAID_TOKENS = new Set(["tt", "đã tt", "thanh toán", "đã thanh toán", "paid"]);
const DELIVERED_TOKENS = new Set(["giao", "đã giao", "delivered", "ship"]);

// Đơn vị dài (nml/nmh) đứng trước đơn vị ngắn (nl/nh) để khớp đúng.
const QTY_RE = /^(\d+)\s*(nml|nmh|nl|nh|bl|bh|c)$/i;

const QTY_FIELD = {
  nl: "so_luong_nem_an_lien_la",
  nh: "so_luong_nem_an_lien_hop",
  nml: "so_luong_nem_moi_la",
  nmh: "so_luong_nem_moi_hop",
  bl: "so_luong_bi_la",
  bh: "so_luong_bi_hop",
  c: "so_luong_cha",
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
        error: "Cần ít nhất 1 số lượng (vd: 2nl, 1nmh, 1bl, 1c).",
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
