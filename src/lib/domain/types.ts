export const PRICE_GROUPS = ["nem_bi", "cha", "chuoi_chien", "khoai_lang_chien"] as const;

export type PriceGroup = (typeof PRICE_GROUPS)[number];

export interface Price {
  price_group: PriceGroup;
  gia_goc: number;
  gia_ban: number;
  effective_from: string;
}

// Nem: (ăn liền|mới) × (lá|hộp) = 4 loại. Bì: lá|hộp = 2 loại. Chả, chuối chiên,
// khoai lang chiên: mỗi thứ 1 loại.
// Nem + bì chung giá nhóm nem_bi; chả và 2 món chiên mỗi thứ 1 nhóm giá riêng.
export interface SoLuong {
  so_luong_nem_an_lien_la: number;
  so_luong_nem_an_lien_hop: number;
  so_luong_nem_moi_la: number;
  so_luong_nem_moi_hop: number;
  so_luong_bi_la: number;
  so_luong_bi_hop: number;
  so_luong_cha: number;
  so_luong_chuoi_chien: number;
  so_luong_khoai_lang_chien: number;
}

// Thứ tự + nhãn hiển thị + nhóm giá của từng loại. Dùng chung cho label, form
// nhập và tổng hợp: thêm sản phẩm mới chỉ cần thêm 1 dòng ở đây.
export const SOLUONG_LEAVES = [
  { key: "so_luong_nem_an_lien_la", label: "Nem ăn liền lá", group: "nem_bi" },
  { key: "so_luong_nem_an_lien_hop", label: "Nem ăn liền hộp", group: "nem_bi" },
  { key: "so_luong_nem_moi_la", label: "Nem mới lá", group: "nem_bi" },
  { key: "so_luong_nem_moi_hop", label: "Nem mới hộp", group: "nem_bi" },
  { key: "so_luong_bi_la", label: "Bì lá", group: "nem_bi" },
  { key: "so_luong_bi_hop", label: "Bì hộp", group: "nem_bi" },
  { key: "so_luong_cha", label: "Chả", group: "cha" },
  { key: "so_luong_chuoi_chien", label: "Chuối chiên", group: "chuoi_chien" },
  { key: "so_luong_khoai_lang_chien", label: "Khoai lang chiên", group: "khoai_lang_chien" },
] as const satisfies readonly { key: keyof SoLuong; label: string; group: PriceGroup }[];

export function zeroSoLuong(): SoLuong {
  return {
    so_luong_nem_an_lien_la: 0,
    so_luong_nem_an_lien_hop: 0,
    so_luong_nem_moi_la: 0,
    so_luong_nem_moi_hop: 0,
    so_luong_bi_la: 0,
    so_luong_bi_hop: 0,
    so_luong_cha: 0,
    so_luong_chuoi_chien: 0,
    so_luong_khoai_lang_chien: 0,
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
  gia_goc_chuoi_chien_snap: number;
  gia_ban_chuoi_chien_snap: number;
  gia_goc_khoai_lang_chien_snap: number;
  gia_ban_khoai_lang_chien_snap: number;
  settlement_id: string | null;
  dot: number;
  created_at: string;
  profiles?: {
    full_name: string;
    bank_bin?: string | null;
    bank_account?: string | null;
    bank_account_name?: string | null;
  } | null;
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
    o.so_luong_cha * o.gia_ban_cha_snap +
    o.so_luong_chuoi_chien * o.gia_ban_chuoi_chien_snap +
    o.so_luong_khoai_lang_chien * o.gia_ban_khoai_lang_chien_snap
  );
}

export function orderTienGoc(o: OrderRow): number {
  return (
    (orderSoLuongNem(o) + orderSoLuongBi(o)) * o.gia_goc_nem_bi_snap +
    o.so_luong_cha * o.gia_goc_cha_snap +
    o.so_luong_chuoi_chien * o.gia_goc_chuoi_chien_snap +
    o.so_luong_khoai_lang_chien * o.gia_goc_khoai_lang_chien_snap
  );
}

// Tổng số phần của 1 đơn / 1 cụm số lượng (mọi loại sản phẩm).
export function tongSoPhan(q: SoLuong): number {
  return SOLUONG_LEAVES.reduce((sum, l) => sum + q[l.key], 0);
}

// Tiền bán theo bảng giá HIỆN TẠI: dùng cho phần xem trước lúc nhập, khi đơn
// chưa lưu nên chưa có snapshot giá.
export function tienBanTheoGia(q: SoLuong, prices: Record<PriceGroup, Price>): number {
  return SOLUONG_LEAVES.reduce((sum, l) => sum + q[l.key] * (prices[l.group]?.gia_ban ?? 0), 0);
}

// Snapshot giá mọi nhóm để gắn vào đơn lúc tạo.
export function priceSnapshot(prices: Record<PriceGroup, Price>) {
  return {
    gia_goc_nem_bi_snap: prices.nem_bi?.gia_goc ?? 0,
    gia_ban_nem_bi_snap: prices.nem_bi?.gia_ban ?? 0,
    gia_goc_cha_snap: prices.cha?.gia_goc ?? 0,
    gia_ban_cha_snap: prices.cha?.gia_ban ?? 0,
    gia_goc_chuoi_chien_snap: prices.chuoi_chien?.gia_goc ?? 0,
    gia_ban_chuoi_chien_snap: prices.chuoi_chien?.gia_ban ?? 0,
    gia_goc_khoai_lang_chien_snap: prices.khoai_lang_chien?.gia_goc ?? 0,
    gia_ban_khoai_lang_chien_snap: prices.khoai_lang_chien?.gia_ban ?? 0,
  };
}

// Đợt hiện tại = số đợt nhỏ nhất trong các đơn chưa quyết toán (0 nếu chưa có đơn).
// Đơn có dot lớn hơn là đợt kế tiếp (đang chờ, chưa tới lượt chốt).
export function currentRound(pending: OrderRow[]): number {
  if (pending.length === 0) return 0;
  return Math.min(...pending.map((o) => o.dot));
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
        soLuongTong: acc.soLuongTong + tongSoPhan(o),
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
    row.soLuong += tongSoPhan(o);
    for (const l of SOLUONG_LEAVES) row[l.key] += o[l.key];
    row.tienBan += tienBan;
    row.tienGoc += tienGoc;
    row.tienLoi += tienBan - tienGoc;
    map.set(name, row);
  }
  return Array.from(map.values()).sort((a, b) => b.tienBan - a.tienBan);
}

// Đoạn chữ để copy/gửi tin nhắn, chỉ liệt kê loại có số lượng:
//   - Nem ăn liền: 2 lá
//   - Nem mới: 1 lá, 3 hộp
//   - Bì: 3 lá
//   Tổng: 225k   (tiền gốc)
export function soLuongText(q: SoLuong, tienGoc: number): string {
  const nhom: [string, [string, number][]][] = [
    ["Nem ăn liền", [["lá", q.so_luong_nem_an_lien_la], ["hộp", q.so_luong_nem_an_lien_hop]]],
    ["Nem mới", [["lá", q.so_luong_nem_moi_la], ["hộp", q.so_luong_nem_moi_hop]]],
    ["Bì", [["lá", q.so_luong_bi_la], ["hộp", q.so_luong_bi_hop]]],
    ["Chả", [["", q.so_luong_cha]]],
    ["Chuối chiên", [["", q.so_luong_chuoi_chien]]],
    ["Khoai lang chiên", [["", q.so_luong_khoai_lang_chien]]],
  ];
  const lines = nhom
    .map(([ten, parts]) => {
      const co = parts.filter(([, n]) => n > 0).map(([dv, n]) => (dv ? `${n} ${dv}` : String(n)));
      return co.length ? `- ${ten}: ${co.join(", ")}` : null;
    })
    .filter(Boolean);
  const tong = `${(tienGoc / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}k`;
  return [...lines, `Tổng: ${tong}`].join("\n");
}
