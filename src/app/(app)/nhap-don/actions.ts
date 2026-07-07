"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPrices } from "@/lib/domain/data";
import { SOLUONG_LEAVES, zeroSoLuong, type SoLuong } from "@/lib/domain/types";
import { parseBulkOrders } from "./parse";

// Đọc 7 trường số lượng từ form. Trả null nếu có trường không hợp lệ hoặc tất cả = 0.
function readSoLuong(formData: FormData): SoLuong | null {
  const q = zeroSoLuong();
  for (const l of SOLUONG_LEAVES) {
    const n = Number(formData.get(l.key) || 0);
    if (!Number.isInteger(n) || n < 0) return null;
    q[l.key] = n;
  }
  if (!Object.values(q).some((n) => n > 0)) return null;
  return q;
}

export async function createOrder(_prevState: string | null, formData: FormData): Promise<string | null> {
  const tenNguoiMua = String(formData.get("ten_nguoi_mua") ?? "").trim();
  const ghiChu = String(formData.get("ghi_chu") ?? "").trim();
  const daThanhToan = formData.get("da_thanh_toan") === "on";
  const daGiao = formData.get("da_giao") === "on";

  if (!tenNguoiMua) return "Nhập tên người mua.";
  const qty = readSoLuong(formData);
  if (!qty) return "Nhập ít nhất 1 số lượng hợp lệ (nem, bì, hoặc chả).";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  const prices = await getCurrentPrices(supabase);
  const nemBi = prices.nem_bi;
  const cha = prices.cha;
  if (!nemBi || !cha) return "Chưa có giá sản phẩm, liên hệ admin.";

  const { error } = await supabase.from("orders").insert({
    seller_id: user.id,
    ten_nguoi_mua: tenNguoiMua,
    ...qty,
    ghi_chu: ghiChu || null,
    da_thanh_toan: daThanhToan,
    da_giao: daGiao,
    gia_goc_nem_bi_snap: nemBi.gia_goc,
    gia_ban_nem_bi_snap: nemBi.gia_ban,
    gia_goc_cha_snap: cha.gia_goc,
    gia_ban_cha_snap: cha.gia_ban,
  });

  if (error) return error.message;

  revalidatePath("/nhap-don");
  return null;
}

// Nhập nhiều đơn 1 lượt từ text (mỗi dòng 1 đơn). Xem parse.ts cho format.
export async function createBulkOrders(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const text = String(formData.get("bulk_text") ?? "");
  const parsed = parseBulkOrders(text);

  if (parsed.length === 0) return "Chưa có dòng nào để nhập.";

  const firstError = parsed.find((r) => !r.ok);
  if (firstError && !firstError.ok) {
    return `Dòng ${firstError.line}: ${firstError.error}`;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  const prices = await getCurrentPrices(supabase);
  const nemBi = prices.nem_bi;
  const cha = prices.cha;
  if (!nemBi || !cha) return "Chưa có giá sản phẩm, liên hệ admin.";

  const rows = parsed.map((r) => {
    // Ép narrow: mọi phần tử ở đây đều ok (đã return ở firstError).
    const o = (r as Extract<typeof r, { ok: true }>).order;
    const { ten_nguoi_mua, ghi_chu, da_thanh_toan, da_giao, ...qty } = o;
    return {
      seller_id: user.id,
      ten_nguoi_mua,
      ...qty,
      ghi_chu,
      da_thanh_toan,
      da_giao,
      gia_goc_nem_bi_snap: nemBi.gia_goc,
      gia_ban_nem_bi_snap: nemBi.gia_ban,
      gia_goc_cha_snap: cha.gia_goc,
      gia_ban_cha_snap: cha.gia_ban,
    };
  });

  const { error } = await supabase.from("orders").insert(rows);
  if (error) return error.message;

  revalidatePath("/nhap-don");
  return null;
}

export async function deleteOrder(orderId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("orders").delete().eq("id", orderId);
  revalidatePath("/nhap-don");
}

// Toggle đã thanh toán / đã giao ngay trên danh sách (chỉ đơn chưa quyết toán).
export async function toggleOrderStatus(
  orderId: string,
  field: "da_thanh_toan" | "da_giao",
  value: boolean,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ [field]: value })
    .eq("id", orderId)
    .is("settlement_id", null);
  revalidatePath("/nhap-don");
}

export async function updateOrder(
  orderId: string,
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const tenNguoiMua = String(formData.get("ten_nguoi_mua") ?? "").trim();
  const ghiChu = String(formData.get("ghi_chu") ?? "").trim();
  const daThanhToan = formData.get("da_thanh_toan") === "on";
  const daGiao = formData.get("da_giao") === "on";

  if (!tenNguoiMua) return "Nhập tên người mua.";
  const qty = readSoLuong(formData);
  if (!qty) return "Nhập ít nhất 1 số lượng hợp lệ (nem, bì, hoặc chả).";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  const { error } = await supabase
    .from("orders")
    .update({
      ten_nguoi_mua: tenNguoiMua,
      ...qty,
      ghi_chu: ghiChu || null,
      da_thanh_toan: daThanhToan,
      da_giao: daGiao,
    })
    .eq("id", orderId)
    .eq("seller_id", user.id)
    .is("settlement_id", null);

  if (error) return error.message;

  revalidatePath("/nhap-don");
  return null;
}
