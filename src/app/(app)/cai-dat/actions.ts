"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PaymentInput {
  momo_phone: string;
  bank_bin: string;
  bank_account: string;
  bank_account_name: string;
}

export async function savePaymentInfo(input: PaymentInput): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Phiên đăng nhập hết hạn, đăng nhập lại.";

  const { error } = await supabase.rpc("set_payment_info", {
    p_momo_phone: input.momo_phone,
    p_bank_bin: input.bank_bin,
    p_bank_account: input.bank_account,
    p_bank_account_name: input.bank_account_name,
  });
  if (error) return error.message;

  revalidatePath("/cai-dat");
  revalidatePath("/nhap-don");
  return null;
}
