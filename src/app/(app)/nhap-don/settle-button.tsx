"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, TriangleAlert, Wallet, ShoppingBag, TrendingUp } from "lucide-react";
import { closeSettlement } from "../quyet-toan/actions";
import { PriceChangeModal } from "../quyet-toan/price-change-modal";
import { SellerTable } from "../quyet-toan/seller-table";
import { useOrders, TMP_PREFIX } from "./orders-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SoLuongChips } from "@/components/soluong-chips";
import {
  buildSellerBreakdown,
  calcProductTotals,
  calcTotals,
  formatVnd,
  type Price,
  type PriceGroup,
} from "@/lib/domain/types";

// Luôn chốt đợt hiện tại, kể cả khi đang xem tab "Đợt kế tiếp".
export function SettleButton({
  prices,
  isAdmin,
}: {
  prices: Record<PriceGroup, Price>;
  isAdmin: boolean;
}) {
  const { orders, currentRound } = useOrders();
  const [open, setOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const current = useMemo(() => orders.filter((o) => o.dot === currentRound), [orders, currentRound]);
  const saving = current.some((o) => o.id.startsWith(TMP_PREFIX));
  const totals = calcTotals(current);
  const sellers = useMemo(() => buildSellerBreakdown(current), [current]);
  const unpaid = current.filter((o) => !o.da_thanh_toan).length;

  function confirm() {
    startTransition(async () => {
      const result = await closeSettlement({ count: current.length, tienBan: totals.tienBan });
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
        router.refresh();
        return;
      }
      setOpen(false);
      toast.success(`Đã quyết toán ${current.length} đơn, xem lại trong Lịch sử.`);
      router.refresh();
      if (isAdmin) setPriceModalOpen(true);
    });
  }

  const money = [
    { icon: Wallet, label: "Tiền gốc", value: totals.tienGoc, accent: false },
    { icon: ShoppingBag, label: "Tiền bán", value: totals.tienBan, accent: false },
    { icon: TrendingUp, label: "Tiền lời", value: totals.tienLoi, accent: true },
  ];

  return (
    <>
      {current.length > 0 && (
        <Button type="button" onClick={() => setOpen(true)} className="h-10 w-full rounded-xl px-4 sm:w-auto">
          <CheckCircle2 />
          Quyết toán
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl sm:p-0">
          <DialogHeader className="gap-1 border-b border-border/60 px-5 pt-5 pb-4 pr-12">
            <DialogTitle className="text-lg">Quyết toán đợt hiện tại</DialogTitle>
            <DialogDescription>
              {current.length} đơn · {totals.soLuongTong} phần. Sau khi chốt, đơn chuyển vào Lịch sử và
              không sửa được nữa.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {money.map((m) => (
                <div
                  key={m.label}
                  className={
                    m.accent
                      ? "col-span-2 flex min-w-0 flex-col gap-1 rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20 sm:col-span-1"
                      : "flex min-w-0 flex-col gap-1 rounded-xl bg-muted/50 p-3"
                  }
                >
                  <dt
                    className={`flex items-center gap-1.5 text-xs ${m.accent ? "font-medium text-primary" : "text-muted-foreground"}`}
                  >
                    <m.icon className="size-3.5" strokeWidth={1.75} />
                    {m.label}
                  </dt>
                  <dd
                    className={`truncate text-lg font-semibold tabular-nums ${m.accent ? "text-primary" : ""}`}
                  >
                    {formatVnd(m.value)}
                  </dd>
                </div>
              ))}
            </dl>

            {unpaid > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-warning/10 px-3.5 py-2.5 text-sm text-warning ring-1 ring-warning/30">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                Còn {unpaid} đơn chưa thanh toán. Vẫn quyết toán được, nhưng nên kiểm tra lại trước.
              </p>
            )}

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Tổng món</h3>
              <SoLuongChips q={calcProductTotals(current)} />
            </section>

            <SellerTable current={sellers} />
          </div>

          <DialogFooter className="m-0 gap-2 px-5 py-4 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Huỷ
            </Button>
            <Button type="button" onClick={confirm} disabled={pending || saving}>
              {pending && <Loader2 className="animate-spin" />}
              {pending
                ? "Đang quyết toán..."
                : saving
                  ? "Đang lưu đơn mới..."
                  : `Xác nhận quyết toán ${current.length} đơn`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PriceChangeModal open={priceModalOpen} onOpenChange={setPriceModalOpen} prices={prices} />
    </>
  );
}
