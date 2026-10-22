import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  full_name: string;
  role: "admin" | "seller";
  status: "pending" | "approved" | "rejected";
  bank_bin: string | null;
  bank_account: string | null;
  bank_account_name: string | null;
}

// getClaims verify chữ ký JWT ngay tại server (khoá bất đối xứng) nên không tốn
// 1 lượt gọi Supabase như getUser; project dùng khoá HS thì nó tự gọi getUser.
// cache(): layout và page trong cùng 1 request chỉ xác thực 1 lần.
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, bank_bin, bank_account, bank_account_name")
    .eq("id", user.id)
    .single();
  return (data as Profile | null) ?? null;
});
