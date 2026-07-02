"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AccountStatus = "pending" | "approved" | "rejected";

async function setUserStatus(userId: string, status: AccountStatus): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  // Chỉ admin mới được duyệt / từ chối.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return "Bạn không có quyền thực hiện thao tác này.";

  if (userId === user.id) return "Không thể tự thay đổi trạng thái của chính mình.";

  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) return error.message;

  revalidatePath("/nguoi-dung");
  return null;
}

export async function approveUser(userId: string): Promise<string | null> {
  return setUserStatus(userId, "approved");
}

export async function rejectUser(userId: string): Promise<string | null> {
  return setUserStatus(userId, "rejected");
}
