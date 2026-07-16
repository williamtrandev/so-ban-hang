import { redirect } from "next/navigation";
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
    .select("momo_phone, bank_bin, bank_account, bank_account_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">
          Thông tin nhận tiền của bạn. Mã QR trên mỗi đơn bạn tạo sẽ dùng cấu hình này. Nội dung
          chuyển khoản mặc định là &quot;{"Chuyen tien do an"}&quot;.
        </p>
      </header>

      <PaymentSettingsForm initial={(profile ?? {}) as PaymentSettings} />
    </div>
  );
}
