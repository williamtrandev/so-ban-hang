"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPendingOrders } from "@/lib/domain/data";
import { PRICE_GROUPS, calcTotals, currentRound, type PriceGroup } from "@/lib/domain/types";

export interface CloseSettlementState {
  error: string | null;
  settledAt: number | null;
}

// expected = số liệu người dùng đang thấy khi bấm xác nhận. Lệch (có người vừa
// thêm/sửa đơn) thì không chốt, để họ xem lại số mới.
export async function closeSettlement(expected: {
  count: number;
  tienBan: number;
}): Promise<CloseSettlementState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập hết hạn, đăng nhập lại.", settledAt: null };

  const pending = await getPendingOrders(supabase);
  if (pending.length === 0) return { error: "Không có đơn nào để quyết toán.", settledAt: null };

  // Chỉ chốt đợt hiện tại (dot nhỏ nhất); đơn đợt kế tiếp giữ nguyên.
  const round = currentRound(pending);
  const current = pending.filter((o) => o.dot === round);
  const totals = calcTotals(current);
  if (current.length !== expected.count || totals.tienBan !== expected.tienBan) {
    revalidatePath("/quyet-toan");
    return {
      error: `Đơn trong đợt vừa thay đổi (giờ có ${current.length} đơn). Xem lại số mới rồi quyết toán.`,
      settledAt: null,
    };
  }

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
    .is("settlement_id", null)
    .in(
      "id",
      current.map((o) => o.id),
    );

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
  // Thiếu ô nào cũng coi là không hợp lệ, tránh ghi nhầm giá 0 cho nhóm bị bỏ sót.
  const readGia = (name: string): number | null => {
    const raw = formData.get(name);
    if (typeof raw !== "string" || raw.trim() === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  // 1 dòng giá mới cho mỗi nhóm sản phẩm.
  const rows: { price_group: PriceGroup; gia_goc: number; gia_ban: number }[] = [];
  for (const g of PRICE_GROUPS) {
    const giaGoc = readGia(`gia_goc_${g}`);
    const giaBan = readGia(`gia_ban_${g}`);
    if (giaGoc === null || giaBan === null) return { error: "Giá không hợp lệ.", saved: false };
    rows.push({ price_group: g, gia_goc: giaGoc, gia_ban: giaBan });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập hết hạn, đăng nhập lại.", saved: false };

  const { error } = await supabase
    .from("prices")
    .insert(rows.map((r) => ({ ...r, set_by: user.id })));

  if (error) return { error: error.message, saved: false };

  revalidatePath("/nhap-don");
  revalidatePath("/quyet-toan");
  return { error: null, saved: true };
}
