"use client";

import { useOrders, type StatusFilter } from "./orders-provider";
import { calcTotals, formatVnd } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

// 1 dòng thống kê của đợt đang xem; "chưa TT"/"chưa giao" bấm để lọc luôn.
export function OrderStats() {
  const { roundOrders, statusFilters, toggleStatusFilter } = useOrders();
  const totals = calcTotals(roundOrders);
  const chuaTT = roundOrders.filter((o) => !o.da_thanh_toan).length;
  const chuaGiao = roundOrders.filter((o) => !o.da_giao).length;

  const filters: { key: StatusFilter; count: number; label: string; warn: boolean }[] = [
    { key: "chua_thanh_toan", count: chuaTT, label: "chưa TT", warn: true },
    { key: "chua_giao", count: chuaGiao, label: "chưa giao", warn: false },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 px-3.5 py-2 ring-1 ring-primary/20">
        <span className="text-lg font-semibold text-primary tabular-nums">{formatVnd(totals.tienBan)}</span>
        <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
          {roundOrders.length} đơn · {totals.soLuongTong} phần
        </span>
      </div>
      {filters.map((f) => {
        const on = statusFilters.has(f.key);
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => toggleStatusFilter(f.key)}
            aria-pressed={on}
            title={on ? "Bỏ lọc" : "Lọc các đơn này"}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm sm:px-3.5 ring-1 transition-colors select-none active:scale-[0.97]",
              on
                ? "bg-primary text-primary-foreground ring-transparent"
                : f.warn && f.count > 0
                  ? "bg-warning/10 text-warning ring-warning/30 hover:ring-warning/60"
                  : "bg-card text-muted-foreground ring-foreground/10 hover:text-foreground",
            )}
          >
            <span className="font-semibold tabular-nums">{f.count}</span>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
