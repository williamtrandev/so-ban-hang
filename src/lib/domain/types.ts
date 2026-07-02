export type PriceGroup = "nem_bi" | "cha";

export interface Price {
  price_group: PriceGroup;
  gia_goc: number;
  gia_ban: number;
  effective_from: string;
}

export interface OrderRow {
  id: string;
  seller_id: string;
  ten_nguoi_mua: string;
  so_luong_nem: number;
  so_luong_bi: number;
  so_luong_cha: number;
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

export function orderTienBan(o: OrderRow): number {
  return (
    (o.so_luong_nem + o.so_luong_bi) * o.gia_ban_nem_bi_snap + o.so_luong_cha * o.gia_ban_cha_snap
  );
}

export function orderTienGoc(o: OrderRow): number {
  return (
    (o.so_luong_nem + o.so_luong_bi) * o.gia_goc_nem_bi_snap + o.so_luong_cha * o.gia_goc_cha_snap
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
        soLuongTong: acc.soLuongTong + o.so_luong_nem + o.so_luong_bi + o.so_luong_cha,
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

export function soLuongLabel(order: OrderRow): string {
  const parts: string[] = [];
  if (order.so_luong_nem > 0) parts.push(`Nem ${order.so_luong_nem}`);
  if (order.so_luong_bi > 0) parts.push(`Bì ${order.so_luong_bi}`);
  if (order.so_luong_cha > 0) parts.push(`Chả ${order.so_luong_cha}`);
  return parts.join(" · ");
}

export interface SellerBreakdownRow {
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
    const row = map.get(name) ?? { name, count: 0, soLuong: 0, tienBan: 0, tienGoc: 0, tienLoi: 0 };
    const tienBan = orderTienBan(o);
    const tienGoc = orderTienGoc(o);
    row.count += 1;
    row.soLuong += o.so_luong_nem + o.so_luong_bi + o.so_luong_cha;
    row.tienBan += tienBan;
    row.tienGoc += tienGoc;
    row.tienLoi += tienBan - tienGoc;
    map.set(name, row);
  }
  return Array.from(map.values()).sort((a, b) => b.tienBan - a.tienBan);
}
