import { SoLuongChips } from "@/components/soluong-chips";
import { formatVnd, type SellerBreakdownRow } from "@/lib/domain/types";

// List thống nhất cho mọi breakpoint: component này luôn nằm trong khung hẹp
// (card nửa màn hình hoặc dialog) nên bảng nhiều cột sẽ tràn ngang.
export function SellerBreakdownTable({ rows }: { rows: SellerBreakdownRow[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {rows.map((row) => (
        <li key={row.name} className="flex flex-col gap-2 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{row.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {row.soLuong} phần · {row.count} đơn
            </span>
          </div>
          <SoLuongChips q={row} />
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Tiền nhận</span>
              <span className="tabular-nums">{formatVnd(row.tienBan)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Vốn</span>
              <span className="tabular-nums text-muted-foreground">{formatVnd(row.tienGoc)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Lời</span>
              <span className="font-medium tabular-nums text-primary">{formatVnd(row.tienLoi)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
