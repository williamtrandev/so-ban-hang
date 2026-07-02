"use client";

import { Loader2, ReceiptText, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { SellerBreakdownTable } from "./seller-breakdown-table";
import {
  formatVnd,
  formatDateTime,
  orderTienBan,
  soLuongLabel,
  buildSellerBreakdown,
  type OrderRow,
} from "@/lib/domain/types";

export function SettlementDetailDialog({
  open,
  closedAt,
  orders,
  loading,
  onOpenChange,
}: {
  open: boolean;
  closedAt: string | null;
  orders: OrderRow[] | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết đợt quyết toán</DialogTitle>
          <DialogDescription>
            {closedAt ? `Chốt lúc ${formatDateTime(closedAt)}` : "Đang tải..."}
          </DialogDescription>
        </DialogHeader>

        {loading && !orders ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang tải chi tiết...
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-8 text-center">
            <ReceiptText className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Đợt này không có đơn nào.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                Theo người bán
              </h3>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60">
                <SellerBreakdownTable rows={buildSellerBreakdown(orders)} />
              </div>
            </div>

            <Separator />

            {/* Mobile: card list */}
            <ul className="flex max-h-96 flex-col gap-2.5 overflow-y-auto md:hidden">
              {orders.map((order) => (
                <li key={order.id} className="flex flex-col gap-2 rounded-lg border border-border/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{order.ten_nguoi_mua}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.profiles?.full_name ?? "—"}
                      </span>
                    </div>
                    <span className="font-medium tabular-nums">{formatVnd(orderTienBan(order))}</span>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">{soLuongLabel(order)}</span>
                  {order.ghi_chu && <p className="text-xs text-muted-foreground">{order.ghi_chu}</p>}
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden max-h-96 overflow-y-auto rounded-lg border border-border/60 md:block">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-popover">
                  <TableRow>
                    <TableHead>Người mua</TableHead>
                    <TableHead>Người bán</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Tiền bán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.ten_nguoi_mua}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {order.profiles?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                        {soLuongLabel(order)}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-muted-foreground">
                        {order.ghi_chu || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVnd(orderTienBan(order))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
