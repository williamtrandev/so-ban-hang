"use client";

import { Calendar, CalendarPlus } from "lucide-react";
import { useOrders } from "./orders-provider";
import { cn } from "@/lib/utils";

function Segment({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Calendar;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all select-none",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
      <span
        className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
          active ? "bg-primary/15 text-primary" : "bg-muted-foreground/15 text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function RoundSwitcher() {
  const { orders, currentRound, viewNext, setViewNext } = useOrders();
  const curCount = orders.filter((o) => o.dot === currentRound).length;
  const nextCount = orders.filter((o) => o.dot === currentRound + 1).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        <Segment
          active={!viewNext}
          onClick={() => setViewNext(false)}
          icon={Calendar}
          label="Đợt hiện tại"
          count={curCount}
        />
        <Segment
          active={viewNext}
          onClick={() => setViewNext(true)}
          icon={CalendarPlus}
          label="Đợt kế tiếp"
          count={nextCount}
        />
      </div>
      {viewNext && (
        <p className="px-1 text-xs text-muted-foreground">
          Đơn nhập vào đây thuộc đợt sau, không bị chốt khi quyết toán đợt hiện tại.
        </p>
      )}
    </div>
  );
}
