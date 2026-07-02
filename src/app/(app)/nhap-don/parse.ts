// Parser cho tính năng nhập nhanh nhiều đơn dạng text.
// Mỗi dòng = 1 đơn, format: "Tên người mua, nem, bì, chả".
// Số lượng theo thứ tự cố định Nem / Bì / Chả, bỏ trống = 0.
// Dùng chung cho client (preview) và server (validate + insert).

export type ParsedOrder = {
  ten_nguoi_mua: string;
  so_luong_nem: number;
  so_luong_bi: number;
  so_luong_cha: number;
};

export type ParseLineResult =
  | { ok: true; line: number; raw: string; order: ParsedOrder }
  | { ok: false; line: number; raw: string; error: string };

function parseQty(raw: string | undefined): number | null {
  const s = (raw ?? "").trim();
  if (s === "") return 0;
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
}

export function parseBulkOrders(text: string): ParseLineResult[] {
  const results: ParseLineResult[] = [];
  const lines = text.split("\n");

  lines.forEach((raw, i) => {
    if (raw.trim() === "") return; // bỏ dòng trống, không tính là lỗi
    const line = i + 1;
    const parts = raw.split(",");
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

    results.push({
      ok: true,
      line,
      raw,
      order: { ten_nguoi_mua, so_luong_nem: nem, so_luong_bi: bi, so_luong_cha: cha },
    });
  });

  return results;
}
