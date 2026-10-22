"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBuyerSuggestions, getCurrentPrices, type BuyerSuggestion } from "@/lib/domain/data";
import {
  SOLUONG_LEAVES,
  priceSnapshot,
  zeroSoLuong,
  type Price,
  type PriceGroup,
  type SoLuong,
} from "@/lib/domain/types";
import { parseBulkOrders } from "./parse";

// Mọi nhóm giá phải có giá hiện hành, nếu không đơn sẽ bị snapshot giá 0.
function thieuGia(prices: Record<PriceGroup, Price>): boolean {
  return SOLUONG_LEAVES.some((l) => !prices[l.group]);
}

// Số đợt cho đơn mới: đợt hiện tại (min dot đơn chưa quyết toán) + 1 nếu là đợt kế tiếp.
async function resolveDot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nextBatch: boolean,
): Promise<number> {
  const { data } = await supabase.from("orders").select("dot").is("settlement_id", null);
  const cur = data && data.length ? Math.min(...data.map((r) => r.dot as number)) : 0;
  return cur + (nextBatch ? 1 : 0);
}

// Đọc mọi trường số lượng từ form. Trả null nếu có trường không hợp lệ hoặc tất cả = 0.
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
  if (!qty) {
    return "Nhập ít nhất 1 số lượng hợp lệ (nem, bì, chả, chuối chiên hoặc khoai lang chiên).";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  const prices = await getCurrentPrices(supabase);
  if (thieuGia(prices)) return "Chưa có giá sản phẩm, liên hệ admin.";

  const dot = await resolveDot(supabase, formData.get("next_batch") === "on");

  const { error } = await supabase.from("orders").insert({
    seller_id: user.id,
    ten_nguoi_mua: tenNguoiMua,
    ...qty,
    ghi_chu: ghiChu || null,
    da_thanh_toan: daThanhToan,
    da_giao: daGiao,
    dot,
    ...priceSnapshot(prices),
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
  if (thieuGia(prices)) return "Chưa có giá sản phẩm, liên hệ admin.";

  const dot = await resolveDot(supabase, formData.get("next_batch") === "on");
  const snap = priceSnapshot(prices);

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
      dot,
      ...snap,
    };
  });

  const { error } = await supabase.from("orders").insert(rows);
  if (error) return error.message;

  revalidatePath("/nhap-don");
  return null;
}

export async function deleteOrder(orderId: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("seller_id", user.id)
    .is("settlement_id", null)
    .select("id");
  if (error) return error.message;
  if (!data?.length) return "Đơn không còn hoặc đã được quyết toán.";

  revalidatePath("/nhap-don");
  return null;
}

// Toggle đã thanh toán / đã giao ngay trên danh sách (chỉ đơn chưa quyết toán).
export async function toggleOrderStatus(
  orderId: string,
  field: "da_thanh_toan" | "da_giao",
  value: boolean,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ [field]: value })
    .eq("id", orderId)
    .is("settlement_id", null)
    .select("id");
  if (error) return error.message;
  if (!data?.length) return "Đơn không còn hoặc đã được quyết toán.";

  revalidatePath("/nhap-don");
  return null;
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
  if (!qty) {
    return "Nhập ít nhất 1 số lượng hợp lệ (nem, bì, chả, chuối chiên hoặc khoai lang chiên).";
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

// Gợi ý khách quen tải sau khi trang đã hiện, không chặn lần render đầu.
export async function loadBuyerSuggestions(): Promise<BuyerSuggestion[]> {
  const supabase = await createClient();
  return getBuyerSuggestions(supabase);
}
