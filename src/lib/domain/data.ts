import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderRow, Price, PriceGroup } from "./types";

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
    .select("*, profiles(full_name)")
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
