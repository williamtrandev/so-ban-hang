import type { SupabaseClient } from "@supabase/supabase-js";
import { SOLUONG_LEAVES, zeroSoLuong, type OrderRow, type Price, type PriceGroup, type SoLuong } from "./types";
import { foldVi } from "@/lib/utils";

export interface SettlementRow {
  id: string;
  closed_by: string;
  tien_goc: number;
  tien_ban: number;
  tien_loi: number;
  closed_at: string;
}

export async function getCurrentPrices(supabase: SupabaseClient): Promise<Record<PriceGroup, Price>> {
  const { data, error } = await supabase
    .from("prices")
    .select("price_group, gia_goc, gia_ban, effective_from")
    .order("effective_from", { ascending: false });

  if (error) throw error;

  const result = {} as Record<PriceGroup, Price>;
  for (const row of data as Price[]) {
    if (!result[row.price_group]) result[row.price_group] = row;
  }
  return result;
}

export async function getPendingOrders(supabase: SupabaseClient): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(full_name, bank_bin, bank_account, bank_account_name)")
    .is("settlement_id", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as OrderRow[];
}

// Lấy toàn bộ (1 dòng/đợt, bảng nhỏ): vừa hiển thị lịch sử vừa tính tổng doanh thu.
export async function getSettlementHistory(supabase: SupabaseClient): Promise<SettlementRow[]> {
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .order("closed_at", { ascending: false });

  if (error) throw error;
  return data as SettlementRow[];
}

// Toàn bộ đơn (đã chốt + đang bán) để tính doanh thu từng người toàn thời gian.
// Quy mô gia đình, bảng nhỏ: fetch hết rồi gộp phía server component.
export async function getAllOrders(supabase: SupabaseClient): Promise<OrderRow[]> {
  const { data, error } = await supabase.from("orders").select("*, profiles(full_name)");

  if (error) throw error;
  return data as OrderRow[];
}

export async function getSettlementOrders(
  supabase: SupabaseClient,
  settlementId: string,
): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(full_name)")
    .eq("settlement_id", settlementId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as OrderRow[];
}

export interface BuyerSuggestion {
  name: string;
  count: number;
  last: SoLuong;
  ghi_chu: string | null;
}

// Khách quen để gợi ý khi nhập đơn: gộp theo tên (không dấu), giữ đơn gần nhất
// làm mẫu "mua như lần trước". Bảng nhỏ nên lấy 2000 đơn mới nhất là đủ.
export async function getBuyerSuggestions(supabase: SupabaseClient): Promise<BuyerSuggestion[]> {
  const cols = ["ten_nguoi_mua", "ghi_chu", ...SOLUONG_LEAVES.map((l) => l.key)].join(", ");
  const { data, error } = await supabase
    .from("orders")
    .select(cols)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;
  const map = new Map<string, BuyerSuggestion>();
  for (const row of data as unknown as (SoLuong & { ten_nguoi_mua: string; ghi_chu: string | null })[]) {
    const key = foldVi(row.ten_nguoi_mua);
    if (!key) continue;
    const hit = map.get(key);
    if (hit) {
      hit.count += 1;
      continue;
    }
    const last = zeroSoLuong();
    for (const l of SOLUONG_LEAVES) last[l.key] = row[l.key];
    map.set(key, { name: row.ten_nguoi_mua.trim(), count: 1, last, ghi_chu: row.ghi_chu });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
