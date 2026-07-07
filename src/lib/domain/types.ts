export type PriceGroup = "nem_bi" | "cha";

export interface Price {
  price_group: PriceGroup;
  gia_goc: number;
  gia_ban: number;
  effective_from: string;
}

// Nem: (ăn liền|mới) × (lá|hộp) = 4 loại. Bì: lá|hộp = 2 loại. Chả: 1 loại.
// Nem + bì cùng giá nhóm nem_bi; chả giá riêng.
export interface SoLuong {
  so_luong_nem_an_lien_la: number;
  so_luong_nem_an_lien_hop: number;
  so_luong_nem_moi_la: number;
  so_luong_nem_moi_hop: number;
  so_luong_bi_la: number;
  so_luong_bi_hop: number;
  so_luong_cha: number;
}

// Thứ tự + nhãn hiển thị cho từng loại. Dùng chung cho label và tổng hợp.
export const SOLUONG_LEAVES = [
  { key: "so_luong_nem_an_lien_la", label: "Nem ăn liền lá" },
  { key: "so_luong_nem_an_lien_hop", label: "Nem ăn liền hộp" },
  { key: "so_luong_nem_moi_la", label: "Nem mới lá" },
  { key: "so_luong_nem_moi_hop", label: "Nem mới hộp" },
  { key: "so_luong_bi_la", label: "Bì lá" },
  { key: "so_luong_bi_hop", label: "Bì hộp" },
  { key: "so_luong_cha", label: "Chả" },
] as const satisfies readonly { key: keyof SoLuong; label: string }[];

export function zeroSoLuong(): SoLuong {
  return {
    so_luong_nem_an_lien_la: 0,
    so_luong_nem_an_lien_hop: 0,
    so_luong_nem_moi_la: 0,
    so_luong_nem_moi_hop: 0,
    so_luong_bi_la: 0,
    so_luong_bi_hop: 0,
    so_luong_cha: 0,
  };
}

export interface OrderRow extends SoLuong {
  id: string;
  seller_id: string;
  ten_nguoi_mua: string;
  ghi_chu: string | null;
  da_thanh_toan: boolean;
  da_giao: boolean;
  gia_goc_nem_bi_snap: number;
  gia_ban_nem_bi_snap: number;
  gia_goc_cha_snap: number;
  gia_ban_cha_snap: number;
  settlement_id: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export interface SettlementTotals {
  tienGoc: number;
  tienBan: number;
  tienLoi: number;
  soLuongTong: number;
}

export function orderSoLuongNem(o: SoLuong): number {
  return (
    o.so_luong_nem_an_lien_la +
    o.so_luong_nem_an_lien_hop +
    o.so_luong_nem_moi_la +
    o.so_luong_nem_moi_hop
  );
}

export function orderSoLuongBi(o: SoLuong): number {
  return o.so_luong_bi_la + o.so_luong_bi_hop;
}

export function orderTienBan(o: OrderRow): number {
  return (
    (orderSoLuongNem(o) + orderSoLuongBi(o)) * o.gia_ban_nem_bi_snap +
    o.so_luong_cha * o.gia_ban_cha_snap
  );
}

export function orderTienGoc(o: OrderRow): number {
  return (
    (orderSoLuongNem(o) + orderSoLuongBi(o)) * o.gia_goc_nem_bi_snap +
    o.so_luong_cha * o.gia_goc_cha_snap
  );
}

export function calcTotals(orders: OrderRow[]): SettlementTotals {
  return orders.reduce<SettlementTotals>(
    (acc, o) => {
      const goc = orderTienGoc(o);
      const ban = orderTienBan(o);
      return {
        tienGoc: acc.tienGoc + goc,
        tienBan: acc.tienBan + ban,
        tienLoi: acc.tienLoi + (ban - goc),
        soLuongTong: acc.soLuongTong + orderSoLuongNem(o) + orderSoLuongBi(o) + o.so_luong_cha,
      };
    },
    { tienGoc: 0, tienBan: 0, tienLoi: 0, soLuongTong: 0 },
  );
}

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

// Timezone cố định để server và client render giống nhau (tránh hydration mismatch).
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}

// Nhãn gọn: chỉ liệt kê loại có số lượng > 0. Nhận mọi object có đủ 7 trường SoLuong.
export function soLuongLabel(q: SoLuong): string {
  return SOLUONG_LEAVES.filter((l) => q[l.key] > 0)
    .map((l) => `${l.label} ${q[l.key]}`)
    .join(" · ");
}

export interface ProductTotals extends SoLuong {
  nemTong: number;
  biTong: number;
}

export function calcProductTotals(orders: SoLuong[]): ProductTotals {
  const t = zeroSoLuong();
  for (const o of orders) {
    for (const l of SOLUONG_LEAVES) t[l.key] += o[l.key];
  }
  return { ...t, nemTong: orderSoLuongNem(t), biTong: orderSoLuongBi(t) };
}

export interface SellerBreakdownRow extends SoLuong {
  name: string;
  count: number;
  soLuong: number;
  tienBan: number;
  tienGoc: number;
  tienLoi: number;
}

export function buildSellerBreakdown(orders: OrderRow[]): SellerBreakdownRow[] {
  const map = new Map<string, SellerBreakdownRow>();
  for (const o of orders) {
    const name = o.profiles?.full_name ?? "Không rõ";
    const row: SellerBreakdownRow =
      map.get(name) ??
      { name, count: 0, soLuong: 0, tienBan: 0, tienGoc: 0, tienLoi: 0, ...zeroSoLuong() };
    const tienBan = orderTienBan(o);
    const tienGoc = orderTienGoc(o);
    row.count += 1;
    row.soLuong += orderSoLuongNem(o) + orderSoLuongBi(o) + o.so_luong_cha;
    for (const l of SOLUONG_LEAVES) row[l.key] += o[l.key];
    row.tienBan += tienBan;
    row.tienGoc += tienGoc;
    row.tienLoi += tienBan - tienGoc;
    map.set(name, row);
  }
  return Array.from(map.values()).sort((a, b) => b.tienBan - a.tienBan);
}
