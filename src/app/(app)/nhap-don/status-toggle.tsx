"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleOrderStatus } from "./actions";
import { useOrders } from "./orders-provider";
import { cn } from "@/lib/utils";
import type { OrderRow } from "@/lib/domain/types";

type Field = "da_thanh_toan" | "da_giao";

// Dùng chung cho nút trạng thái và nút "Đã nhận tiền" trong dialog QR: cập nhật
// lạc quan ở provider để mọi chỗ hiển thị đổi cùng lúc, lỗi thì tự quay về.
export function useSetOrderStatus() {
  const { apply } = useOrders();
  const [pending, startTransition] = useTransition();

  function setStatus(orderId: string, field: Field, value: boolean, onDone?: () => void) {
    startTransition(async () => {
      apply({ type: "update", id: orderId, patch: { [field]: value } });
      const error = await toggleOrderStatus(orderId, field, value);
      if (error) toast.error(`Chưa lưu được: ${error}`);
      else onDone?.();
    });
  }

  return { setStatus, pending };
}

export function StatusToggle({
  order,
  field,
  labelOn,
  labelOff,
}: {
  order: OrderRow;
  field: Field;
  labelOn: string;
  labelOff: string;
}) {
  const { setStatus, pending } = useSetOrderStatus();
  const on = order[field];
  const warnWhenOff = field === "da_thanh_toan";

  return (
    <button
      type="button"
      onClick={() => setStatus(order.id, field, !on)}
      disabled={pending}
      aria-pressed={on}
      title={on ? `Bấm để chuyển về "${labelOff}"` : `Bấm để chuyển sang "${labelOn}"`}
      className={cn(
        "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition-all select-none active:scale-[0.97] disabled:opacity-60 md:h-7 md:px-2.5 md:text-[11px]",
        on
          ? "border-transparent bg-primary text-primary-foreground"
          : warnWhenOff
            ? "border-warning/40 bg-warning/10 text-warning hover:border-warning/70"
            : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {on ? labelOn : labelOff}
    </button>
  );
}
