"use client";

import { useState, useTransition } from "react";
import { History, ChevronRight } from "lucide-react";
import { SettlementDetailDialog } from "./settlement-detail-dialog";
import { getSettlementDetail } from "./actions";
import { formatVnd, type OrderRow } from "@/lib/domain/types";
import type { SettlementRow } from "@/lib/domain/data";

// Timezone cố định để server và client render giống nhau (tránh hydration mismatch).
function dateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    weekday: get("weekday"),
    day: get("day"),
    month: get("month"),
    year: get("year"),
    time: `${get("hour")}:${get("minute")}`,
  };
}

type Item = { s: SettlementRow; dot: number; d: ReturnType<typeof dateParts> };

// Các đợt đã sắp mới nhất trước; gom liên tiếp theo tháng để list dài dễ dò.
function groupByMonth(settlements: SettlementRow[]) {
  const groups: { key: string; label: string; loi: number; items: Item[] }[] = [];
  settlements.forEach((s, i) => {
    const d = dateParts(s.closed_at);
    const key = `${d.year}-${d.month}`;
    let g = groups.at(-1);
    if (!g || g.key !== key) {
      g = { key, label: `Tháng ${d.month}, ${d.year}`, loi: 0, items: [] };
      groups.push(g);
    }
    g.loi += s.tien_loi;
    g.items.push({ s, dot: settlements.length - i, d });
  });
  return groups;
}

// Mobile: badge · thông tin · lời · mũi tên. Desktop thêm 2 cột gốc, bán.
const ROW_GRID =
  "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_repeat(3,8rem)_auto] sm:gap-4";

export function SettlementHistory({ settlements }: { settlements: SettlementRow[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [detailOrders, setDetailOrders] = useState<OrderRow[] | null>(null);
  const [pending, startTransition] = useTransition();

  function openDetail(item: Item) {
    setSelected(item);
    setDetailOrders(null);
    setOpen(true);
    startTransition(async () => {
      const data = await getSettlementDetail(item.s.id);
      setDetailOrders(data);
    });
  }

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-10 text-center">
        <History className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">Chưa có đợt quyết toán nào.</p>
      </div>
    );
  }

  const groups = groupByMonth(settlements);
  let index = 0;

  return (
    <>
      <div
        className={`${ROW_GRID} hidden border-b border-border/60 px-3 pb-2 text-xs text-muted-foreground sm:grid`}
      >
        <span className="col-span-2">Đợt</span>
        <span className="text-right">Tiền gốc</span>
        <span className="text-right">Tiền bán</span>
        <span className="text-right">Tiền lời</span>
        <span className="size-4" />
      </div>

      <div className="flex flex-col gap-1">
        {groups.map((g) => (
          <section key={g.key} className="flex flex-col">
            <div className="flex items-baseline justify-between gap-2 px-3 pt-4 pb-1.5 text-xs">
              <span className="font-medium text-foreground/80">{g.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {g.items.length} đợt · lời {formatVnd(g.loi)}
              </span>
            </div>
            <ul className="flex flex-col">
              {g.items.map((item) => {
                const { s, d, dot } = item;
                const i = index++;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      className={`${ROW_GRID} group w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/50 active:bg-muted/70 focus-visible:bg-muted/50 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-1 duration-300`}
                      style={{
                        animationDelay: `${Math.min(i, 10) * 35}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <span className="flex size-11 flex-col items-center justify-center rounded-xl bg-muted/60 leading-none ring-1 ring-foreground/5 transition-colors group-hover:bg-card dark:group-hover:bg-muted">
                        <span className="text-base font-semibold tabular-nums">{d.day}</span>
                        <span className="mt-1 text-[10px] font-medium text-muted-foreground uppercase">
                          Th{d.month}
                        </span>
                      </span>

                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium">Đợt #{dot}</span>
                        <span className="truncate text-xs text-muted-foreground first-letter:uppercase">
                          {d.weekday} · {d.time}
                        </span>
                      </div>

                      <span className="hidden text-right text-sm text-muted-foreground tabular-nums sm:block">
                        {formatVnd(s.tien_goc)}
                      </span>
                      <span className="hidden text-right text-sm tabular-nums sm:block">
                        {formatVnd(s.tien_ban)}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-primary tabular-nums">
                          +{formatVnd(s.tien_loi)}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums sm:hidden">
                          bán {formatVnd(s.tien_ban)}
                        </span>
                      </div>

                      <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <SettlementDetailDialog
        open={open}
        settlement={selected?.s ?? null}
        dot={selected?.dot ?? null}
        orders={detailOrders}
        loading={pending}
        onOpenChange={setOpen}
      />
    </>
  );
}
