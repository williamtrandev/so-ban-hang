"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd, orderTienBan, type OrderRow } from "@/lib/domain/types";

// Số MoMo nhận tiền + nội dung chuyển khoản (để tránh bị cục thuế đánh dấu).
const MOMO_PHONE = "0907640698";
const TRANSFER_NOTE = "chuyển tiền đồ ăn";

// Chuỗi QR chuyển tiền cá nhân của MoMo. App MoMo tự tra tên người nhận từ SĐT.
// Định dạng: 2|99|<sđt>|<tên>|<email>|0|0|<số tiền>|<nội dung>|transfer_p2p
function buildMomoQr(amount: number, note: string): string {
  return `2|99|${MOMO_PHONE}|||0|0|${amount}|${note}|transfer_p2p`;
}

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
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG
                  value={buildMomoQr(amount, TRANSFER_NOTE)}
                  size={200}
                  level="M"
                  marginSize={0}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Quét bằng app MoMo để chuyển tiền
              </p>
              <div className="flex flex-col gap-1.5">
                <CopyRow label="Số MoMo" value={MOMO_PHONE} />
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
