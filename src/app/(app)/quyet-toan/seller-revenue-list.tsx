import { Crown } from "lucide-react";
import { formatVnd, type SellerBreakdownRow } from "@/lib/domain/types";

export function SellerRevenueList({ rows }: { rows: SellerBreakdownRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có đơn nào.</p>;
  }

  return (
    <ul className="divide-y divide-border/60">
      {rows.map((row, i) => (
        <li key={row.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
              i === 0 ? "bg-primary/15 text-primary ring-1 ring-primary/20" : "bg-muted text-muted-foreground"
            }`}
          >
            {i === 0 ? <Crown className="size-4" strokeWidth={1.75} /> : i + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{row.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {row.count} đơn · {row.soLuong} phần
            </span>
          </div>
          <dl className="flex shrink-0 flex-col items-end gap-0.5">
            <dt className="sr-only">Tiền bán</dt>
            <dd className="text-sm font-semibold tabular-nums">{formatVnd(row.tienBan)}</dd>
            <dt className="sr-only">Tiền gốc</dt>
            <dd className="text-xs text-muted-foreground tabular-nums">
              gốc <span className="font-medium text-foreground/80">{formatVnd(row.tienGoc)}</span>
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
