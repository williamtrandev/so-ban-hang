"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, CheckCircle2, Landmark, Info, ScanLine, Send, ClipboardCopy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd, orderTienBan, soLuongLines, type OrderRow } from "@/lib/domain/types";
import {
  bankByBin,
  bankInitials,
  buildVietQr,
  hasBank,
  type PaymentInfo,
} from "@/lib/domain/payment";
import { useSetOrderStatus } from "./status-toggle";
import { paymentImage, paymentText, type PaymentShareInfo } from "./payment-share";

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
  const { setStatus, pending } = useSetOrderStatus();
  const qrRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<Blob | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const share: PaymentShareInfo | null = bankOk
    ? {
        buyer: order.ten_nguoi_mua,
        amount,
        bankName: bank?.short ?? "Ngân hàng",
        accountLabel: isMomo ? "SĐT MoMo" : "Số tài khoản",
        account: pay.bank_account!,
        accountName: pay.bank_account_name,
        items: soLuongLines(order),
      }
    : null;
  const shareKey = share ? JSON.stringify(share) : "";

  // Dựng ảnh sẵn khi mở hộp: Safari chỉ cho mở bảng chia sẻ ngay sau cú bấm, không đợi được.
  useEffect(() => {
    if (!open || !share) return;
    let alive = true;
    const t = setTimeout(() => {
      const svg = qrRef.current?.querySelector("svg");
      if (!svg) return;
      paymentImage(svg, share)
        .then((b) => alive && setImage(b))
        .catch(() => {});
    }, 50);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shareKey]);

  async function sendImage() {
    if (!image || !share) return;
    const file = new File([image], `thanh-toan-${order.ten_nguoi_mua}.png`, { type: "image/png" });
    const touch = window.matchMedia("(pointer: coarse)").matches;
    try {
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: paymentText(share) });
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": image })]);
      toast.success("Đã copy ảnh mã thanh toán", {
        description: "Dán vào Zalo hoặc Messenger để gửi cho khách.",
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      await copyText();
    }
  }

  async function copyText() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(paymentText(share));
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 1500);
      toast.success("Đã copy thông tin thanh toán");
    } catch {
      toast.error("Không copy được, thử lại.");
    }
  }

  function markPaid() {
    setStatus(order.id, "da_thanh_toan", true, () => {
      toast.success(`${order.ten_nguoi_mua} đã thanh toán.`);
      setOpen(false);
    });
  }

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
              <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-card to-muted/30 p-4 shadow-[0_16px_40px_-24px_color-mix(in_oklch,var(--foreground)_35%,transparent)]">
                <div className="mb-3 flex items-center justify-between">
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

                <div ref={qrRef} className="flex justify-center rounded-xl bg-white p-4">
                  <QRCodeSVG
                    value={buildVietQr({
                      bin: pay.bank_bin!,
                      account: pay.bank_account!,
                      amount,
                    })}
                    size={200}
                    level="M"
                    marginSize={0}
                  />
                </div>

                <dl className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-xs text-muted-foreground">
                      {isMomo ? "SĐT MoMo" : "Số tài khoản"}
                    </dt>
                    <dd className="truncate font-medium tabular-nums">{pay.bank_account}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-xs text-muted-foreground">Chủ tài khoản</dt>
                    <dd className="truncate font-medium uppercase">
                      {pay.bank_account_name || "—"}
                    </dd>
                  </div>
                </dl>
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
                <CopyRow label="Số tiền" value={amount.toLocaleString("vi-VN")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="h-10" disabled={!image} onClick={sendImage}>
                  {image ? <Send /> : <Loader2 className="animate-spin" />}
                  Gửi mã cho khách
                </Button>
                <Button type="button" variant="outline" className="h-10" onClick={copyText}>
                  {copiedText ? <Check className="text-primary" /> : <ClipboardCopy />}
                  Copy thông tin
                </Button>
              </div>
            </div>
          )}

          {!paid && (
            <Button type="button" className="h-11 w-full" disabled={pending} onClick={markPaid}>
              <CheckCircle2 />
              Đã nhận tiền
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
