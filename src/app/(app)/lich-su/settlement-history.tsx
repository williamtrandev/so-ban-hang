"use client";

import { useState, useTransition } from "react";
import { History, ChevronRight, ChevronDown } from "lucide-react";
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
  const groups: { key: string; label: string; goc: number; ban: number; loi: number; items: Item[] }[] = [];
  settlements.forEach((s, i) => {
    const d = dateParts(s.closed_at);
    const key = `${d.year}-${d.month}`;
    let g = groups.at(-1);
    if (!g || g.key !== key) {
      g = { key, label: `Tháng ${d.month}, ${d.year}`, goc: 0, ban: 0, loi: 0, items: [] };
      groups.push(g);
    }
    g.goc += s.tien_goc;
    g.ban += s.tien_ban;
    g.loi += s.tien_loi;
    g.items.push({ s, dot: settlements.length - i, d });
  });
  return groups;
}

// Mobile: badge · thông tin · lời · mũi tên. Desktop thêm 2 cột gốc, bán.
const ROW_GRID =
  "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_repeat(3,8rem)_auto] sm:gap-4";

export function SettlementHistory({
  settlements,
  currentUserId,
}: {
  settlements: SettlementRow[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  // Chỉ tháng gần nhất mở sẵn; tháng cũ gọn lại thành 1 dòng tổng, bấm để mở.
  const [expanded, setExpanded] = useState<Set<string> | null>(null);
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

      <div className="flex flex-col">
        {groups.map((g, gi) => {
          const isOpen = expanded ? expanded.has(g.key) : gi === 0;
          return (
            <section key={g.key} className="flex flex-col border-b border-border/50 last:border-b-0">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setExpanded((prev) => {
                    const next = new Set(prev ?? [groups[0].key]);
                    if (next.has(g.key)) next.delete(g.key);
                    else next.add(g.key);
                    return next;
                  })
                }
                className={`${ROW_GRID} w-full rounded-xl px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/40`}
              >
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`}
                />
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">{g.label}</span>
                  <span className="text-muted-foreground tabular-nums">{g.items.length} đợt</span>
                </span>
                <span className="hidden text-right text-muted-foreground tabular-nums sm:block">
                  {formatVnd(g.goc)}
                </span>
                <span className="hidden text-right tabular-nums sm:block">{formatVnd(g.ban)}</span>
                <span className="text-right font-medium text-primary tabular-nums">+{formatVnd(g.loi)}</span>
                <span className="size-4" />
              </button>
              {isOpen && (
                <ul className="flex flex-col pb-2 animate-in fade-in duration-200">
                  {g.items.map((item) => {
                    const { s, d, dot } = item;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className={`${ROW_GRID} group w-full rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/50 active:bg-muted/70 focus-visible:bg-muted/50 focus-visible:outline-none`}
                        >
                          <span className="flex size-9 items-center justify-center rounded-lg bg-muted/60 text-sm font-semibold tabular-nums ring-1 ring-foreground/5 transition-colors group-hover:bg-card dark:group-hover:bg-muted">
                            {d.day}
                          </span>
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="text-sm font-medium">Đợt #{dot}</span>
                            <span className="truncate text-xs text-muted-foreground first-letter:uppercase">
                              {d.weekday} · {d.time}
                            </span>
                          </span>
                          <span className="hidden text-right text-sm text-muted-foreground tabular-nums sm:block">
                            {formatVnd(s.tien_goc)}
                          </span>
                          <span className="hidden text-right text-sm tabular-nums sm:block">
                            {formatVnd(s.tien_ban)}
                          </span>
                          <span className="text-right text-sm font-semibold text-primary tabular-nums">
                            +{formatVnd(s.tien_loi)}
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <SettlementDetailDialog
        open={open}
        settlement={selected?.s ?? null}
        dot={selected?.dot ?? null}
        orders={detailOrders}
        loading={pending}
        currentUserId={currentUserId}
        onOpenChange={setOpen}
      />
    </>
  );
}
