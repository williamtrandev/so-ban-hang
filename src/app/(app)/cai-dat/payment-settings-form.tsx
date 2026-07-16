"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BANKS, TRANSFER_NOTE, buildVietQr } from "@/lib/domain/payment";
import { savePaymentInfo } from "./actions";

export interface PaymentSettings {
  momo_phone: string | null;
  bank_bin: string | null;
  bank_account: string | null;
  bank_account_name: string | null;
}

export function PaymentSettingsForm({ initial }: { initial: PaymentSettings }) {
  const [momo, setMomo] = useState(initial.momo_phone ?? "");
  const [bin, setBin] = useState(initial.bank_bin ?? "");
  const [account, setAccount] = useState(initial.bank_account ?? "");
  const [accountName, setAccountName] = useState(initial.bank_account_name ?? "");
  const [pending, startTransition] = useTransition();

  // Xem trước QR ngân hàng (số tiền ví dụ) để kiểm tra cấu hình có quét được.
  const previewQr =
    bin && account.trim()
      ? buildVietQr({ bin, account: account.trim(), amount: 50000, note: TRANSFER_NOTE })
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const err = await savePaymentInfo({
        momo_phone: momo,
        bank_bin: bin,
        bank_account: account,
        bank_account_name: accountName,
      });
      if (err) toast.error(err);
      else toast.success("Đã lưu thông tin nhận tiền.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
        <h2 className="text-sm font-semibold">Ví MoMo</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="momo">Số điện thoại MoMo</Label>
          <Input
            id="momo"
            type="tel"
            inputMode="tel"
            value={momo}
            onChange={(e) => setMomo(e.target.value)}
            placeholder="Ví dụ: 0907640698"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
        <h2 className="text-sm font-semibold">Tài khoản ngân hàng (VietQR)</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank">Ngân hàng</Label>
          <select
            id="bank"
            value={bin}
            onChange={(e) => setBin(e.target.value)}
            className={cn(
              "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
            )}
          >
            <option value="">— Chọn ngân hàng —</option>
            {BANKS.map((b) => (
              <option key={b.bin} value={b.bin}>
                {b.short} — {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account">Số tài khoản</Label>
          <Input
            id="account"
            inputMode="numeric"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="Số tài khoản nhận tiền"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-name">Tên chủ tài khoản</Label>
          <Input
            id="account-name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="NGUYEN VAN A"
          />
        </div>

        {previewQr && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
            <div className="rounded-md bg-white p-2">
              <QRCodeSVG value={previewQr} size={92} level="M" marginSize={0} />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <QrCode className="size-3.5" />
              Xem trước VietQR. Thử quét bằng app ngân hàng để chắc đúng tài khoản.
            </p>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Lưu
        </Button>
      </div>
    </form>
  );
}
