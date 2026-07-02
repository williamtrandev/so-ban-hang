"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SellerBreakdownTable } from "./seller-breakdown-table";
import { formatVnd, type SettlementTotals, type SellerBreakdownRow } from "@/lib/domain/types";

export function ConfirmSettleDialog({
  open,
  onOpenChange,
  totals,
  pendingCount,
  sellerBreakdown,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totals: SettlementTotals;
  pendingCount: number;
  sellerBreakdown: SellerBreakdownRow[];
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Xác nhận quyết toán {pendingCount} đơn</DialogTitle>
          <DialogDescription>
            Sau khi quyết toán, các đơn này sẽ chuyển vào lịch sử và không sửa được nữa.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60">
          <SellerBreakdownTable rows={sellerBreakdown} />
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tiền gốc</span>
            <span className="tabular-nums">{formatVnd(totals.tienGoc)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tiền bán</span>
            <span className="tabular-nums">{formatVnd(totals.tienBan)}</span>
          </div>
          <div className="flex items-center justify-between font-medium text-primary">
            <span>Tiền lời</span>
            <span className="tabular-nums">{formatVnd(totals.tienLoi)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Huỷ
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Đang quyết toán..." : "Xác nhận quyết toán"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
