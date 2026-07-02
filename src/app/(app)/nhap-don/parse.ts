// Parser cho tính năng nhập nhanh nhiều đơn dạng text.
// Mỗi dòng = 1 đơn, format: "Tên người mua, nem, bì, chả[, ...phần thêm]".
// Cột ngăn bởi dấu phẩy HOẶC tab (paste thẳng từ Excel/Google Sheets).
// Số lượng theo thứ tự cố định Nem / Bì / Chả, bỏ trống = 0.
// Sau chả, các trường thừa (thứ tự tự do): token "tt" = đã thanh toán,
// "giao" = đã giao, phần còn lại gộp thành ghi chú.
// Dùng chung cho client (preview) và server (validate + insert).

export type ParsedOrder = {
  ten_nguoi_mua: string;
  so_luong_nem: number;
  so_luong_bi: number;
  so_luong_cha: number;
  ghi_chu: string | null;
  da_thanh_toan: boolean;
  da_giao: boolean;
};

export type ParseLineResult =
  | { ok: true; line: number; raw: string; order: ParsedOrder }
  | { ok: false; line: number; raw: string; error: string };

const PAID_TOKENS = new Set(["tt", "đã tt", "thanh toán", "đã thanh toán", "paid"]);
const DELIVERED_TOKENS = new Set(["giao", "đã giao", "delivered", "ship"]);

function parseQty(raw: string | undefined): number | null {
  const s = (raw ?? "").trim();
  if (s === "") return 0;
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
}

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

    const nem = parseQty(parts[1]);
    const bi = parseQty(parts[2]);
    const cha = parseQty(parts[3]);

    if (nem === null || bi === null || cha === null) {
      results.push({ ok: false, line, raw, error: "Số lượng phải là số nguyên không âm." });
      return;
    }
    if (nem === 0 && bi === 0 && cha === 0) {
      results.push({ ok: false, line, raw, error: "Cần ít nhất 1 số lượng (nem, bì, hoặc chả)." });
      return;
    }

    // Phần sau chả: phân loại token trạng thái, còn lại là ghi chú.
    let da_thanh_toan = false;
    let da_giao = false;
    const noteParts: string[] = [];
    for (const part of parts.slice(4)) {
      const t = part.trim();
      if (t === "") continue;
      const key = t.toLowerCase();
      if (PAID_TOKENS.has(key)) da_thanh_toan = true;
      else if (DELIVERED_TOKENS.has(key)) da_giao = true;
      else noteParts.push(t);
    }
    const ghi_chu = noteParts.length > 0 ? noteParts.join(", ") : null;

    results.push({
      ok: true,
      line,
      raw,
      order: {
        ten_nguoi_mua,
        so_luong_nem: nem,
        so_luong_bi: bi,
        so_luong_cha: cha,
        ghi_chu,
        da_thanh_toan,
        da_giao,
      },
    });
  });

  return results;
}
