"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, CheckCircle2, Landmark, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd, orderTienBan, type OrderRow } from "@/lib/domain/types";
import {
  TRANSFER_NOTE,
  bankByBin,
  buildVietQr,
  hasBank,
  type PaymentInfo,
} from "@/lib/domain/payment";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="truncate font-medium tabular-nums">{value}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Sao chép ${label}`}
        onClick={handleCopy}
      >
        {copied ? <Check className="text-primary" /> : <Copy />}
      </Button>
    </div>
  );
}

export function PaymentQrButton({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const amount = orderTienBan(order);
  const paid = order.da_thanh_toan;

  const pay: PaymentInfo = {
    bank_bin: order.profiles?.bank_bin ?? null,
    bank_account: order.profiles?.bank_account ?? null,
    bank_account_name: order.profiles?.bank_account_name ?? null,
  };
  const bankOk = hasBank(pay);
  const bank = bankByBin(pay.bank_bin);
  const isMomo = pay.bank_bin === "971025";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-primary"
        aria-label="Mã thanh toán"
        onClick={() => setOpen(true)}
      >
        <QrCode />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mã thanh toán</DialogTitle>
            <DialogDescription>
              {order.ten_nguoi_mua} · {formatVnd(amount)}
            </DialogDescription>
          </DialogHeader>

          {paid ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="size-10 text-primary" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Đơn này đã thanh toán.</p>
            </div>
          ) : !bankOk ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Landmark className="size-9 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                {order.profiles?.full_name ?? "Người tạo đơn"} chưa cấu hình nhận tiền.
                <br />
                Vào <span className="font-medium text-foreground">Cài đặt</span> để thêm tài khoản
                ngân hàng (hoặc MoMo).
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG
                  value={buildVietQr({
                    bin: pay.bank_bin!,
                    account: pay.bank_account!,
                    amount,
                    note: TRANSFER_NOTE,
                  })}
                  size={200}
                  level="M"
                  marginSize={0}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {isMomo
                  ? "Quét bằng app ngân hàng để chuyển vào ví MoMo"
                  : "Quét bằng app ngân hàng hoặc MoMo (VietQR)"}
              </p>
              {isMomo && (
                <p className="flex items-start gap-1.5 rounded-md bg-primary/8 px-3 py-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>
                    Người mua dùng app <span className="font-medium text-foreground">MoMo</span> thì
                    chuyển thẳng tới SĐT bên dưới, không quét mã này.
                  </span>
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <CopyRow
                  label={isMomo ? "SĐT MoMo" : bank ? `Ngân hàng · ${bank.short}` : "Số tài khoản"}
                  value={pay.bank_account!}
                />
                {pay.bank_account_name && (
                  <CopyRow label="Chủ tài khoản" value={pay.bank_account_name} />
                )}
                <CopyRow label="Số tiền" value={amount.toLocaleString("vi-VN")} />
                <CopyRow label="Nội dung" value={TRANSFER_NOTE} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
