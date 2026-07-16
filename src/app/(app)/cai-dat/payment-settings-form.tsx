"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, QrCode, ScanLine, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BANKS, TRANSFER_NOTE, bankByBin, buildVietQr } from "@/lib/domain/payment";
import { savePaymentInfo } from "./actions";

export interface PaymentSettings {
  bank_bin: string | null;
  bank_account: string | null;
  bank_account_name: string | null;
}

// Badge chữ cho ngân hàng: MoMo dùng nhãn riêng, còn lại lấy 2 ký tự đầu.
function bankInitials(short: string): string {
  if (short.toLowerCase() === "momo") return "Mo";
  return short.replace(/[^A-Za-z]/g, "").slice(0, 2) || "NH";
}

function PreviewCard({
  bin,
  account,
  accountName,
}: {
  bin: string;
  account: string;
  accountName: string;
}) {
  const bank = bankByBin(bin);
  const ready = !!(bin && account.trim());
  const value = ready
    ? buildVietQr({ bin, account: account.trim(), amount: 50000, note: TRANSFER_NOTE })
    : "";

  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card to-muted/30 p-4 shadow-[0_16px_40px_-24px_color-mix(in_oklch,var(--foreground)_35%,transparent)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-[13px] font-bold tracking-tight text-primary ring-1 ring-primary/20">
            {bank ? bankInitials(bank.short) : "NH"}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{bank?.short ?? "Ngân hàng"}</span>
            <span className="text-[11px] text-muted-foreground">Nhận tiền</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-muted-foreground">
          <ScanLine className="size-3.5" />
          VietQR
        </span>
      </div>

      <div className="relative flex aspect-square items-center justify-center rounded-xl bg-white p-4">
        {ready ? (
          <div key={value} className="animate-in fade-in zoom-in-95 duration-300">
            <QRCodeSVG value={value} size={176} level="M" marginSize={0} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-gray-400">
            <QrCode className="size-10" strokeWidth={1.25} />
            <span className="max-w-40 text-xs">Nhập tài khoản để xem mã QR</span>
          </div>
        )}
      </div>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-xs text-muted-foreground">
            {bin === "971025" ? "SĐT MoMo" : "Số tài khoản"}
          </dt>
          <dd className="truncate font-medium tabular-nums">{account.trim() || "—"}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-xs text-muted-foreground">Chủ tài khoản</dt>
          <dd className="truncate font-medium uppercase">{accountName.trim() || "—"}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2">
          <dt className="shrink-0 text-xs text-muted-foreground">Nội dung</dt>
          <dd className="truncate text-muted-foreground">{TRANSFER_NOTE}</dd>
        </div>
      </dl>
    </div>
  );
}

export function PaymentSettingsForm({ initial }: { initial: PaymentSettings }) {
  const [bin, setBin] = useState(initial.bank_bin ?? "");
  const [account, setAccount] = useState(initial.bank_account ?? "");
  const [accountName, setAccountName] = useState(initial.bank_account_name ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const isMomo = bin === "971025";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const err = await savePaymentInfo({
        bank_bin: bin,
        bank_account: account,
        bank_account_name: accountName,
      });
      if (err) {
        toast.error(err);
        return;
      }
      toast.success("Đã lưu thông tin nhận tiền.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
      {/* Cột nhập liệu */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bank">Ngân hàng</Label>
          <div className="relative">
            <select
              id="bank"
              value={bin}
              onChange={(e) => setBin(e.target.value)}
              className={cn(
                "h-11 w-full appearance-none rounded-xl border border-input bg-transparent pr-10 pl-3.5 text-sm outline-none transition-colors hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              )}
            >
              <option value="">— Chọn ngân hàng —</option>
              {BANKS.map((b) => (
                <option key={b.bin} value={b.bin}>
                  {b.short} — {b.name}
                </option>
              ))}
            </select>
            <QrCode className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {isMomo && (
            <p className="text-xs text-primary/80">
              MoMo nhận qua VietQR — số tài khoản chính là số điện thoại.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account">{isMomo ? "Số điện thoại MoMo" : "Số tài khoản"}</Label>
          <Input
            id="account"
            inputMode="numeric"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder={isMomo ? "Ví dụ: 0907640698" : "Số tài khoản nhận tiền"}
            className="h-11 rounded-xl px-3.5"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-name">Tên chủ tài khoản</Label>
          <Input
            id="account-name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="NGUYEN VAN A"
            className="h-11 rounded-xl px-3.5 uppercase placeholder:normal-case"
          />
          <p className="text-xs text-muted-foreground">
            Viết in hoa, không dấu — trùng với tên trên app ngân hàng.
          </p>
        </div>

        <div className="mt-1 flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="min-w-28 rounded-xl transition-transform active:scale-[0.98]"
          >
            {pending ? (
              <Loader2 className="animate-spin" />
            ) : saved ? (
              <Check />
            ) : null}
            {saved ? "Đã lưu" : "Lưu"}
          </Button>
        </div>
      </div>

      {/* Cột preview: dính khi cuộn trên desktop */}
      <div className="md:sticky md:top-24">
        <PreviewCard bin={bin} account={account} accountName={accountName} />
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ScanLine className="size-3.5" />
          Thử quét bằng app ngân hàng để chắc đúng tài khoản.
        </p>
      </div>
    </form>
  );
}
