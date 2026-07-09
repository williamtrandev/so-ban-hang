"use server";

import { createClient } from "@/lib/supabase/server";
import { getSettlementOrders } from "@/lib/domain/data";
import type { OrderRow } from "@/lib/domain/types";

// Load đơn của 1 đợt đã chốt khi mở dialog chi tiết.
export async function getSettlementDetail(settlementId: string): Promise<OrderRow[]> {
  const supabase = await createClient();
  return getSettlementOrders(supabase, settlementId);
}
