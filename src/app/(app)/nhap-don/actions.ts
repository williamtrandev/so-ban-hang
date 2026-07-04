"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPrices } from "@/lib/domain/data";
import { parseBulkOrders } from "./parse";

export async function createOrder(_prevState: string | null, formData: FormData): Promise<string | null> {
  const tenNguoiMua = String(formData.get("ten_nguoi_mua") ?? "").trim();
  const soLuongNemAnLien = Number(formData.get("so_luong_nem_an_lien") || 0);
  const soLuongNemMoi = Number(formData.get("so_luong_nem_moi") || 0);
  const soLuongBi = Number(formData.get("so_luong_bi") || 0);
  const soLuongCha = Number(formData.get("so_luong_cha") || 0);
  const ghiChu = String(formData.get("ghi_chu") ?? "").trim();
  const daThanhToan = formData.get("da_thanh_toan") === "on";
  const daGiao = formData.get("da_giao") === "on";

  if (!tenNguoiMua) return "Nhập tên người mua.";
  for (const n of [soLuongNemAnLien, soLuongNemMoi, soLuongBi, soLuongCha]) {
    if (!Number.isInteger(n) || n < 0) return "Số lượng phải là số nguyên không âm.";
  }
  if (soLuongNemAnLien === 0 && soLuongNemMoi === 0 && soLuongBi === 0 && soLuongCha === 0) {
    return "Nhập ít nhất 1 số lượng (nem, bì, hoặc chả).";
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

  const { error } = await supabase.from("orders").insert({
    seller_id: user.id,
    ten_nguoi_mua: tenNguoiMua,
    so_luong_nem_an_lien: soLuongNemAnLien,
    so_luong_nem_moi: soLuongNemMoi,
    so_luong_bi: soLuongBi,
    so_luong_cha: soLuongCha,
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
    return {
      seller_id: user.id,
      ten_nguoi_mua: o.ten_nguoi_mua,
      so_luong_nem_an_lien: o.so_luong_nem_an_lien,
      so_luong_nem_moi: o.so_luong_nem_moi,
      so_luong_bi: o.so_luong_bi,
      so_luong_cha: o.so_luong_cha,
      ghi_chu: o.ghi_chu,
      da_thanh_toan: o.da_thanh_toan,
      da_giao: o.da_giao,
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
  const soLuongNemAnLien = Number(formData.get("so_luong_nem_an_lien") || 0);
  const soLuongNemMoi = Number(formData.get("so_luong_nem_moi") || 0);
  const soLuongBi = Number(formData.get("so_luong_bi") || 0);
  const soLuongCha = Number(formData.get("so_luong_cha") || 0);
  const ghiChu = String(formData.get("ghi_chu") ?? "").trim();
  const daThanhToan = formData.get("da_thanh_toan") === "on";
  const daGiao = formData.get("da_giao") === "on";

  if (!tenNguoiMua) return "Nhập tên người mua.";
  for (const n of [soLuongNemAnLien, soLuongNemMoi, soLuongBi, soLuongCha]) {
    if (!Number.isInteger(n) || n < 0) return "Số lượng phải là số nguyên không âm.";
  }
  if (soLuongNemAnLien === 0 && soLuongNemMoi === 0 && soLuongBi === 0 && soLuongCha === 0) {
    return "Nhập ít nhất 1 số lượng (nem, bì, hoặc chả).";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  const { error } = await supabase
    .from("orders")
    .update({
      ten_nguoi_mua: tenNguoiMua,
      so_luong_nem_an_lien: soLuongNemAnLien,
      so_luong_nem_moi: soLuongNemMoi,
      so_luong_bi: soLuongBi,
      so_luong_cha: soLuongCha,
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
