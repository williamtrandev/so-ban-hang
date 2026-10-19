import { SoLuongChips } from "@/components/soluong-chips";
import { formatVnd, type SellerBreakdownRow } from "@/lib/domain/types";

// List thống nhất cho mọi breakpoint: component này luôn nằm trong khung hẹp
// (card nửa màn hình hoặc dialog) nên bảng nhiều cột sẽ tràn ngang.
export function SellerBreakdownTable({ rows }: { rows: SellerBreakdownRow[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {rows.map((row) => (
        <li key={row.name} className="flex flex-col gap-2.5 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-medium">{row.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {row.count} đơn · {row.soLuong} phần
            </span>
          </div>
          <SoLuongChips q={row} />
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Tiền gốc</dt>
              <dd className="truncate tabular-nums">{formatVnd(row.tienGoc)}</dd>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Tiền bán</dt>
              <dd className="truncate tabular-nums">{formatVnd(row.tienBan)}</dd>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Tiền lời</dt>
              <dd className="truncate font-medium tabular-nums text-primary">
                {formatVnd(row.tienLoi)}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
