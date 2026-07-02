import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatVnd, type SellerBreakdownRow } from "@/lib/domain/types";

export function SellerBreakdownTable({ rows }: { rows: SellerBreakdownRow[] }) {
  return (
    <>
      {/* Mobile: card list */}
      <ul className="flex flex-col gap-2.5 md:hidden">
        {rows.map((row) => (
          <li key={row.name} className="flex flex-col gap-2 rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{row.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {row.soLuong} phần · {row.count} đơn
              </span>
            </div>
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

      {/* Desktop: table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Người bán</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead className="text-right">Tiền nhận</TableHead>
              <TableHead className="text-right">Vốn</TableHead>
              <TableHead className="text-right">Lời</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums text-muted-foreground">
                  {row.soLuong} phần · {row.count} đơn
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatVnd(row.tienBan)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatVnd(row.tienGoc)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-primary">
                  {formatVnd(row.tienLoi)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
