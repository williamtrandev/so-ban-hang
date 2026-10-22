"use client";

import { Package, ReceiptText, Users, type LucideIcon } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { SoLuongChips } from "@/components/soluong-chips";
import { SellerBreakdownTable } from "../quyet-toan/seller-breakdown-table";
import {
  formatVnd,
  formatDateTime,
  orderTienBan,
  tongSoPhan,
  buildSellerBreakdown,
  calcProductTotals,
  type OrderRow,
} from "@/lib/domain/types";
import type { SettlementRow } from "@/lib/domain/data";

function Section({
  icon: Icon,
  title,
  meta,
  children,
}: {
  icon: LucideIcon;
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
        {title}
        {meta && <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">{meta}</span>}
      </h3>
      {children}
    </section>
  );
}

export function SettlementDetailDialog({
  open,
  settlement,
  dot,
  orders,
  loading,
  currentUserId,
  onOpenChange,
}: {
  open: boolean;
  settlement: SettlementRow | null;
  dot: number | null;
  orders: OrderRow[] | null;
  loading: boolean;
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const stats = settlement
    ? [
        { label: "Tiền gốc", value: settlement.tien_goc, accent: false },
        { label: "Tiền bán", value: settlement.tien_ban, accent: false },
        { label: "Tiền lời", value: settlement.tien_loi, accent: true },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Header đứng yên, chỉ phần thân cuộn: tránh nhiều vùng cuộn lồng nhau. */}
      <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl sm:p-0">
        <DialogHeader className="gap-1 border-b border-border/60 px-5 pt-5 pb-4 pr-12">
          <DialogTitle className="text-lg">
            {dot ? `Đợt #${dot}` : "Chi tiết đợt quyết toán"}
          </DialogTitle>
          <DialogDescription className="tabular-nums">
            {settlement ? `Chốt lúc ${formatDateTime(settlement.closed_at)}` : "Đang tải..."}
            {orders && orders.length > 0 && ` · ${orders.length} đơn`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className={
                  s.accent
                    ? "col-span-2 flex min-w-0 flex-col gap-1 rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20 sm:col-span-1"
                    : "flex min-w-0 flex-col gap-1 rounded-xl bg-muted/50 p-3"
                }
              >
                <dt className={s.accent ? "text-xs font-medium text-primary" : "text-xs text-muted-foreground"}>
                  {s.label}
                </dt>
                <dd
                  className={`truncate text-base font-semibold tabular-nums sm:text-lg ${s.accent ? "text-primary" : ""}`}
                >
                  {formatVnd(s.value)}
                </dd>
              </div>
            ))}
          </dl>

          {loading && !orders ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/40 p-8 text-center">
              <ReceiptText className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Đợt này không có đơn nào.</p>
            </div>
          ) : (
            <>
              {(() => {
                const pt = calcProductTotals(orders);
                return (
                  <Section icon={Package} title="Số lượng đã bán" meta={`${tongSoPhan(pt)} phần`}>
                    <SoLuongChips q={pt} className="[&>span]:px-2.5 [&>span]:py-1.5 [&>span]:text-sm" />
                  </Section>
                );
              })()}

              {(() => {
                const sellers = buildSellerBreakdown(orders);
                return (
                  <Section icon={Users} title="Theo người bán" meta={`${sellers.length} người`}>
                    <div className="rounded-xl border border-border/60">
                      <SellerBreakdownTable rows={sellers} />
                    </div>
                  </Section>
                );
              })()}

              <Section icon={ReceiptText} title="Đơn hàng" meta={`${orders.length} đơn`}>
                {/* Mobile: list */}
                <ul className="divide-y divide-border/60 rounded-xl border border-border/60 md:hidden">
                  {orders.map((order) => (
                    <li key={order.id} className="flex flex-col gap-2 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{order.ten_nguoi_mua}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.seller_id === currentUserId ? "Tôi" : (order.profiles?.full_name ?? "—")}
                          </span>
                        </div>
                        <span className="shrink-0 font-medium tabular-nums">
                          {formatVnd(orderTienBan(order))}
                        </span>
                      </div>
                      <SoLuongChips q={order} />
                      {order.ghi_chu && (
                        <p className="text-xs text-muted-foreground">{order.ghi_chu}</p>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Desktop: table */}
                <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs text-muted-foreground">Người mua</TableHead>
                        <TableHead className="h-9 text-xs text-muted-foreground">Người bán</TableHead>
                        <TableHead className="h-9 text-xs text-muted-foreground">Số lượng</TableHead>
                        <TableHead className="h-9 text-right text-xs text-muted-foreground">
                          Tiền bán
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} className="border-border/60">
                          <TableCell className="max-w-48 whitespace-normal">
                            <span className="font-medium">{order.ten_nguoi_mua}</span>
                            {order.ghi_chu && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{order.ghi_chu}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {order.seller_id === currentUserId ? "Tôi" : (order.profiles?.full_name ?? "—")}
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <SoLuongChips q={order} />
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatVnd(orderTienBan(order))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
