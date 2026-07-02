"use client";

import { useState, useTransition } from "react";
import { History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      {/* Mobile: card list */}
      <ul className="flex max-h-[420px] flex-col gap-2.5 overflow-y-auto md:hidden">
        {settlements.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => openDetail(s)}
              className="flex w-full flex-col gap-2 rounded-lg border border-border/70 p-3 text-left transition-colors hover:bg-muted/40 active:scale-[0.99] animate-in fade-in slide-in-from-bottom-1 duration-300"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
            >
              <span className="text-sm font-medium">{formatDateTime(s.closed_at)}</span>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Tiền gốc</span>
                  <span className="tabular-nums">{formatVnd(s.tien_goc)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Tiền bán</span>
                  <span className="tabular-nums">{formatVnd(s.tien_ban)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Tiền lời</span>
                  <span className="font-medium tabular-nums text-primary">{formatVnd(s.tien_loi)}</span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden max-h-[420px] overflow-y-auto rounded-lg border border-border/60 md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Ngày quyết toán</TableHead>
              <TableHead className="text-right">Tiền gốc</TableHead>
              <TableHead className="text-right">Tiền bán</TableHead>
              <TableHead className="text-right">Tiền lời</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settlements.map((s, i) => (
              <TableRow
                key={s.id}
                onClick={() => openDetail(s)}
                className="cursor-pointer animate-in fade-in slide-in-from-left-1 duration-300"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
              >
                <TableCell>{formatDateTime(s.closed_at)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatVnd(s.tien_goc)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatVnd(s.tien_ban)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-primary">
                  {formatVnd(s.tien_loi)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
