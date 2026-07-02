"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderForm } from "./order-form";
import type { Price, PriceGroup } from "@/lib/domain/types";

export function AddOrderBar({ prices }: { prices: Record<PriceGroup, Price> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center sm:bottom-6">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background/80 py-2 pr-2 pl-4 shadow-[0_12px_32px_-12px_color-mix(in_oklch,var(--foreground)_35%,transparent),inset_0_1px_0_color-mix(in_oklch,var(--foreground)_6%,transparent)] backdrop-blur-xl max-sm:w-full max-sm:justify-between">
          <p className="hidden text-sm text-muted-foreground sm:block">Đợt hiện tại</p>
          <Button
            onClick={() => setOpen(true)}
            className="transition-transform hover:-translate-y-px max-sm:flex-1"
          >
            <Plus />
            Thêm đơn mới
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Đơn mới</DialogTitle>
            <DialogDescription>Ghi thông tin người mua và số lượng đã bán.</DialogDescription>
          </DialogHeader>
          <OrderForm prices={prices} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
