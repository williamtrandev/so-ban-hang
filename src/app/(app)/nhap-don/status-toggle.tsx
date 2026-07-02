"use client";

import { useOptimistic, useTransition } from "react";
import { toggleOrderStatus } from "./actions";
import { cn } from "@/lib/utils";

export function StatusToggle({
  orderId,
  field,
  value,
  labelOn,
  labelOff,
}: {
  orderId: string;
  field: "da_thanh_toan" | "da_giao";
  value: boolean;
  labelOn: string;
  labelOff: string;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);

  function handleToggle() {
    startTransition(async () => {
      setOptimistic(!optimistic);
      await toggleOrderStatus(orderId, field, !optimistic);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={optimistic}
      title={optimistic ? `Bấm để chuyển về "${labelOff}"` : `Bấm để chuyển sang "${labelOn}"`}
      className={cn(
        "inline-flex h-6 shrink-0 cursor-pointer items-center rounded-md border px-2 text-[11px] font-medium whitespace-nowrap transition-all select-none active:scale-[0.97] disabled:opacity-60",
        optimistic
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {optimistic ? labelOn : labelOff}
    </button>
  );
}
