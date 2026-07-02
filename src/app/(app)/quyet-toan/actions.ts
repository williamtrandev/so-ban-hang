"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPendingOrders, getSettlementOrders } from "@/lib/domain/data";
import { calcTotals } from "@/lib/domain/types";
import type { OrderRow } from "@/lib/domain/types";

export interface CloseSettlementState {
  error: string | null;
  settledAt: number | null;
}

export async function closeSettlement(): Promise<CloseSettlementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập hết hạn, đăng nhập lại.", settledAt: null };

  const pending = await getPendingOrders(supabase);
  if (pending.length === 0) return { error: "Không có đơn nào để quyết toán.", settledAt: null };

  const totals = calcTotals(pending);

  const { data: settlement, error: settlementError } = await supabase
    .from("settlements")
    .insert({
      closed_by: user.id,
      tien_goc: totals.tienGoc,
      tien_ban: totals.tienBan,
      tien_loi: totals.tienLoi,
    })
    .select("id")
    .single();

  if (settlementError || !settlement) {
    return { error: settlementError?.message ?? "Không tạo được đợt quyết toán.", settledAt: null };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ settlement_id: settlement.id })
    .is("settlement_id", null);

  if (updateError) return { error: updateError.message, settledAt: null };

  revalidatePath("/quyet-toan");
  revalidatePath("/nhap-don");
  return { error: null, settledAt: Date.now() };
}

export interface UpdatePricesState {
  error: string | null;
  saved: boolean;
}

export async function updatePrices(
  _prevState: UpdatePricesState,
  formData: FormData,
): Promise<UpdatePricesState> {
  const giaGocNemBi = Number(formData.get("gia_goc_nem_bi"));
  const giaBanNemBi = Number(formData.get("gia_ban_nem_bi"));
  const giaGocCha = Number(formData.get("gia_goc_cha"));
  const giaBanCha = Number(formData.get("gia_ban_cha"));

  for (const n of [giaGocNemBi, giaBanNemBi, giaGocCha, giaBanCha]) {
    if (!Number.isFinite(n) || n < 0) return { error: "Giá không hợp lệ.", saved: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập hết hạn, đăng nhập lại.", saved: false };

  const { error } = await supabase.from("prices").insert([
    { price_group: "nem_bi", gia_goc: giaGocNemBi, gia_ban: giaBanNemBi, set_by: user.id },
    { price_group: "cha", gia_goc: giaGocCha, gia_ban: giaBanCha, set_by: user.id },
  ]);

  if (error) return { error: error.message, saved: false };

  revalidatePath("/nhap-don");
  revalidatePath("/quyet-toan");
  return { error: null, saved: true };
}

export async function getSettlementDetail(settlementId: string): Promise<OrderRow[]> {
  const supabase = await createClient();
  return getSettlementOrders(supabase, settlementId);
}
