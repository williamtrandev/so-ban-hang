"use client";

import { useState } from "react";
import { Crown, Users } from "lucide-react";
import {
  formatVnd,
  orderSoLuongBi,
  orderSoLuongNem,
  type SellerBreakdownRow,
  type SoLuong,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type Tab = "dot" | "all";

// Gộp lá/hộp cho gọn 1 dòng: "Nem 17 · Bì 8 · Chả 2".
function compactItems(q: SoLuong): [string, number][] {
  const items: [string, number][] = [
    ["Nem", orderSoLuongNem(q)],
    ["Bì", orderSoLuongBi(q)],
    ["Chả", q.so_luong_cha],
    ["Chuối chiên", q.so_luong_chuoi_chien],
    ["Khoai lang", q.so_luong_khoai_lang_chien],
  ];
  return items.filter(([, n]) => n > 0);
}

// Desktop: 4 cột thẳng hàng. Mobile: tên ở trên, 3 cột số ở dưới.
const GRID = "grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))]";

function Money({ label, value, profit }: { label: string; value: number; profit?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col sm:items-end">
      <span className="text-[11px] text-muted-foreground sm:hidden">{label}</span>
      <span
        className={cn(
          "truncate text-sm tabular-nums",
          profit ? "font-semibold text-primary" : "text-foreground",
        )}
      >
        {profit && value > 0 ? "+" : ""}
        {formatVnd(value)}
      </span>
    </div>
  );
}

// Không truyền allTime thì ẩn tab (dùng trong hộp xem trước quyết toán).
export function SellerTable({
  current,
  allTime,
  title = "Theo người bán",
  defaultTab = "dot",
}: {
  current: SellerBreakdownRow[];
  allTime?: SellerBreakdownRow[];
  title?: string;
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const rows = tab === "all" && allTime ? allTime : current;
  const total = rows.reduce(
    (a, r) => ({ goc: a.goc + r.tienGoc, ban: a.ban + r.tienBan, loi: a.loi + r.tienLoi }),
    { goc: 0, ban: 0, loi: 0 },
  );

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-medium whitespace-nowrap">
          <Users className="size-4 text-muted-foreground" strokeWidth={1.75} />
          {title}
        </h2>
        {allTime && (
        <div className="flex gap-0.5 rounded-lg bg-muted p-0.5 dark:bg-background/60">
          {(
            [
              ["dot", "Đợt này", "Đợt này"],
              ["all", "Tất cả", "Toàn thời gian"],
            ] as const
          ).map(([key, short, long]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors sm:px-3",
                tab === key
                  ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10 dark:bg-muted"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{long}</span>
            </button>
          ))}
        </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {tab === "dot" ? "Đợt này chưa có đơn nào." : "Chưa có đơn nào."}
        </p>
      ) : (
        <>
          <div className={cn(GRID, "hidden border-b border-border/60 pb-2 text-xs text-muted-foreground sm:grid")}>
            <span>Người bán</span>
            <span className="text-right">Tiền gốc</span>
            <span className="text-right">Tiền bán</span>
            <span className="text-right">Tiền lời</span>
          </div>
          <ul className="divide-y divide-border/60">
            {rows.map((r, i) => (
              <li key={r.name} className={cn(GRID, "items-center py-3")}>
                <div className="col-span-3 flex min-w-0 items-center gap-3 sm:col-span-1">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                      i === 0 ? "bg-primary/15 text-primary ring-1 ring-primary/20" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {i === 0 ? <Crown className="size-4" strokeWidth={1.75} /> : i + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium">{r.name}</span>
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="mr-1 text-xs text-muted-foreground tabular-nums">
                        {r.count} đơn · {r.soLuong} phần
                      </span>
                      {compactItems(r).map(([label, n]) => (
                        <span
                          key={label}
                          className="rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {label} <span className="font-medium text-foreground tabular-nums">{n}</span>
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
                <Money label="Tiền gốc" value={r.tienGoc} />
                <Money label="Tiền bán" value={r.tienBan} />
                <Money label="Tiền lời" value={r.tienLoi} profit />
              </li>
            ))}
          </ul>
          {rows.length > 1 && (
            <div className={cn(GRID, "items-center border-t border-border pt-3")}>
              <span className="col-span-3 text-sm font-medium sm:col-span-1">Tổng</span>
              <Money label="Tiền gốc" value={total.goc} />
              <Money label="Tiền bán" value={total.ban} />
              <Money label="Tiền lời" value={total.loi} profit />
            </div>
          )}
        </>
      )}
    </div>
  );
}
