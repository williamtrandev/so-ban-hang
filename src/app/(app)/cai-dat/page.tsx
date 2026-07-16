import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PaymentSettingsForm, type PaymentSettings } from "./payment-settings-form";

export default async function CaiDatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase
    .from("profiles")
    .select("bank_bin, bank_account, bank_account_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <header className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
          <Landmark className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Tài khoản nhận tiền</h1>
          <p className="text-sm text-muted-foreground">
            Mã QR trên mỗi đơn bạn tạo sẽ dùng cấu hình này. Chọn ngân hàng hoặc MoMo để nhận
            chuyển khoản.
          </p>
        </div>
      </header>

      <PaymentSettingsForm initial={(profile ?? {}) as PaymentSettings} />
    </div>
  );
}
