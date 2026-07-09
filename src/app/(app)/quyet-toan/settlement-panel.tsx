"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, ShoppingBag, TrendingUp, CheckCircle2, PartyPopper, Users } from "lucide-react";
import { closeSettlement } from "./actions";
import { PriceChangeModal } from "./price-change-modal";
import { ConfirmSettleDialog } from "./confirm-settle-dialog";
import { SellerBreakdownTable } from "./seller-breakdown-table";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/animated-number";
import {
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
      const result = await closeSettlement();
      if (result.error) {
        toast.error(result.error);
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

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="size-3.5 max-sm:hidden" strokeWidth={1.75} />
            Tiền gốc
          </dt>
          <dd className="text-sm font-semibold tabular-nums sm:text-xl">
            <AnimatedNumber value={totals.tienGoc} formatter={formatVnd} />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShoppingBag className="size-3.5 max-sm:hidden" strokeWidth={1.75} />
            Tiền bán
          </dt>
          <dd className="text-sm font-semibold tabular-nums sm:text-xl">
            <AnimatedNumber value={totals.tienBan} formatter={formatVnd} />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg bg-primary/10 p-3 ring-1 ring-primary/20">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <TrendingUp className="size-3.5 max-sm:hidden" strokeWidth={1.75} />
            Tiền lời
          </dt>
          <dd className="text-sm font-semibold tabular-nums text-primary sm:text-xl">
            <AnimatedNumber value={totals.tienLoi} formatter={formatVnd} />
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          Theo người bán
          <span className="text-xs font-normal text-muted-foreground">({sellerBreakdown.length})</span>
        </h3>
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border/60">
          <SellerBreakdownTable rows={sellerBreakdown} />
        </div>
      </div>

      <Button type="button" onClick={() => setConfirmOpen(true)} className="w-full sm:w-auto">
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
