"use client";

import { useState, useTransition } from "react";
import { History, ChevronRight } from "lucide-react";
import { SettlementDetailDialog } from "./settlement-detail-dialog";
import { getSettlementDetail } from "./actions";
import { formatVnd, formatDateTime, type OrderRow } from "@/lib/domain/types";
import type { SettlementRow } from "@/lib/domain/data";

export function SettlementHistory({ settlements }: { settlements: SettlementRow[] }) {
  const [selected, setSelected] = useState<SettlementRow | null>(null);
  const [detailOrders, setDetailOrders] = useState<OrderRow[] | null>(null);
  const [pending, startTransition] = useTransition();

  function openDetail(settlement: SettlementRow) {
    setSelected(settlement);
    setDetailOrders(null);
    startTransition(async () => {
      const data = await getSettlementDetail(settlement.id);
      setDetailOrders(data);
    });
  }

  function closeDetail() {
    setSelected(null);
    setDetailOrders(null);
  }

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-10 text-center">
        <History className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">Chưa có đợt quyết toán nào.</p>
      </div>
    );
  }

  return (
    <>
      {/* List thống nhất mọi breakpoint: khung hẹp (cột nửa màn hình), bảng sẽ chật. */}
      <ul className="max-h-[420px] divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/60">
        {settlements.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => openDetail(s)}
              className="group flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60 animate-in fade-in slide-in-from-bottom-1 duration-300"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <History className="size-4" strokeWidth={1.75} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{formatDateTime(s.closed_at)}</span>
                <span className="truncate text-xs text-muted-foreground tabular-nums">
                  Gốc {formatVnd(s.tien_goc)} · Bán {formatVnd(s.tien_ban)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-muted-foreground">Lời</span>
                  <span className="font-semibold tabular-nums text-primary">
                    +{formatVnd(s.tien_loi)}
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <SettlementDetailDialog
        open={!!selected}
        closedAt={selected?.closed_at ?? null}
        orders={detailOrders}
        loading={pending}
        onOpenChange={(open) => !open && closeDetail()}
      />
    </>
  );
}
