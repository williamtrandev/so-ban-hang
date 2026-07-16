"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, CheckCircle2, Wallet, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatVnd, orderTienBan, type OrderRow } from "@/lib/domain/types";
import {
  TRANSFER_NOTE,
  bankByBin,
  buildMomoQr,
  buildVietQr,
  hasBank,
  hasMomo,
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

function QrPanel({ value, hint, rows }: { value: string; hint: string; rows: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center rounded-lg bg-white p-4">
        <QRCodeSVG value={value} size={200} level="M" marginSize={0} />
      </div>
      <p className="text-center text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-col gap-1.5">{rows}</div>
    </div>
  );
}

export function PaymentQrButton({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  const amount = orderTienBan(order);
  const paid = order.da_thanh_toan;

  const pay: PaymentInfo = {
    momo_phone: order.profiles?.momo_phone ?? null,
    bank_bin: order.profiles?.bank_bin ?? null,
    bank_account: order.profiles?.bank_account ?? null,
    bank_account_name: order.profiles?.bank_account_name ?? null,
  };
  const momoOk = hasMomo(pay);
  const bankOk = hasBank(pay);
  const bank = bankByBin(pay.bank_bin);

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
          ) : !momoOk && !bankOk ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Wallet className="size-9 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                {order.profiles?.full_name ?? "Người tạo đơn"} chưa cấu hình nhận tiền.
                <br />
                Vào <span className="font-medium text-foreground">Cài đặt</span> để thêm MoMo /
                tài khoản ngân hàng.
              </p>
            </div>
          ) : (
            <Tabs defaultValue={momoOk ? "momo" : "bank"} className="gap-4">
              {momoOk && bankOk && (
                <TabsList className="w-full">
                  <TabsTrigger value="momo">
                    <Wallet /> MoMo
                  </TabsTrigger>
                  <TabsTrigger value="bank">
                    <Landmark /> Ngân hàng
                  </TabsTrigger>
                </TabsList>
              )}

              {momoOk && (
                <TabsContent value="momo">
                  <QrPanel
                    value={buildMomoQr({ phone: pay.momo_phone!, amount, note: TRANSFER_NOTE })}
                    hint="Quét bằng app MoMo để chuyển tiền"
                    rows={
                      <>
                        <CopyRow label="Số MoMo" value={pay.momo_phone!} />
                        <CopyRow label="Số tiền" value={amount.toLocaleString("vi-VN")} />
                        <CopyRow label="Nội dung" value={TRANSFER_NOTE} />
                      </>
                    }
                  />
                </TabsContent>
              )}

              {bankOk && (
                <TabsContent value="bank">
                  <QrPanel
                    value={buildVietQr({
                      bin: pay.bank_bin!,
                      account: pay.bank_account!,
                      amount,
                      note: TRANSFER_NOTE,
                    })}
                    hint="Quét bằng app ngân hàng bất kỳ (VietQR)"
                    rows={
                      <>
                        <CopyRow
                          label={bank ? `Ngân hàng · ${bank.short}` : "Số tài khoản"}
                          value={pay.bank_account!}
                        />
                        {pay.bank_account_name && (
                          <CopyRow label="Chủ tài khoản" value={pay.bank_account_name} />
                        )}
                        <CopyRow label="Số tiền" value={amount.toLocaleString("vi-VN")} />
                        <CopyRow label="Nội dung" value={TRANSFER_NOTE} />
                      </>
                    }
                  />
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
