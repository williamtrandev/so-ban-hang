"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, ShoppingBag, TrendingUp, CheckCircle2, PartyPopper } from "lucide-react";
import { closeSettlement } from "./actions";
import { PriceChangeModal } from "./price-change-modal";
import { ConfirmSettleDialog } from "./confirm-settle-dialog";
import { SoLuongChips } from "@/components/soluong-chips";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/animated-number";
import {
  calcProductTotals,
  formatVnd,
  type SettlementTotals,
  type Price,
  type PriceGroup,
  type SellerBreakdownRow,
} from "@/lib/domain/types";

export function SettlementPanel({
  totals,
  pendingCount,
  isAdmin,
  prices,
  sellerBreakdown,
}: {
  totals: SettlementTotals;
  pendingCount: number;
  isAdmin: boolean;
  prices: Record<PriceGroup, Price>;
  sellerBreakdown: SellerBreakdownRow[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirmSettle() {
    startTransition(async () => {
      const result = await closeSettlement({ count: pendingCount, tienBan: totals.tienBan });
      if (result.error) {
        toast.error(result.error);
        setConfirmOpen(false);
        router.refresh();
        return;
      }
      setConfirmOpen(false);
      toast.success("Quyết toán thành công.");
      router.refresh();
      if (isAdmin) setPriceModalOpen(true);
    });
  }

  if (pendingCount === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-10 text-center">
        <PartyPopper className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          Chưa có đơn nào trong đợt này, chưa có gì để quyết toán.
        </p>
      </div>
    );
  }

  const rows = [
    { icon: Wallet, label: "Tiền gốc", value: totals.tienGoc, accent: false },
    { icon: ShoppingBag, label: "Tiền bán", value: totals.tienBan, accent: false },
    { icon: TrendingUp, label: "Tiền lời", value: totals.tienLoi, accent: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className={
              r.accent
                ? "mt-1 flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-3.5 py-3 ring-1 ring-primary/20"
                : "flex items-center justify-between gap-3 px-3.5 py-1.5"
            }
          >
            <dt
              className={`flex items-center gap-2 text-sm ${r.accent ? "font-medium text-primary" : "text-muted-foreground"}`}
            >
              <r.icon className="size-4" strokeWidth={1.75} />
              {r.label}
            </dt>
            <dd
              className={`font-semibold tabular-nums ${r.accent ? "text-xl text-primary" : "text-base"}`}
            >
              <AnimatedNumber value={r.value} formatter={formatVnd} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">
          {pendingCount} đơn · {totals.soLuongTong} phần
        </span>
        <SoLuongChips q={calcProductTotals(sellerBreakdown)} />
      </div>

      <Button type="button" onClick={() => setConfirmOpen(true)} className="h-11 w-full text-base">
        <CheckCircle2 />
        Quyết toán {pendingCount} đơn
      </Button>

      <ConfirmSettleDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        totals={totals}
        pendingCount={pendingCount}
        sellerBreakdown={sellerBreakdown}
        pending={pending}
        onConfirm={handleConfirmSettle}
      />
      <PriceChangeModal open={priceModalOpen} onOpenChange={setPriceModalOpen} prices={prices} />
    </div>
  );
}
