"use client";

import { useMemo, useState, useTransition } from "react";
import { ReceiptText, Trash2, Pencil, Search, Loader2 } from "lucide-react";
import { deleteOrder } from "./actions";
import { OrderForm } from "./order-form";
import { useOrders, TMP_PREFIX } from "./orders-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { StatusToggle } from "./status-toggle";
import { PaymentQrButton } from "./payment-qr-dialog";
import { SoLuongChips } from "@/components/soluong-chips";
import {
  formatVnd,
  formatDateTime,
  calcTotals,
  calcProductTotals,
  orderTienBan,
  type OrderRow,
  type Price,
  type PriceGroup,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type StatusFilter = "chua_thanh_toan" | "chua_giao";

function StatusPair({ order }: { order: OrderRow }) {
  return (
    <div className="flex gap-1.5">
      <StatusToggle
        orderId={order.id}
        field="da_thanh_toan"
        value={order.da_thanh_toan}
        labelOn="Đã TT"
        labelOff="Chưa TT"
      />
      <StatusToggle
        orderId={order.id}
        field="da_giao"
        value={order.da_giao}
        labelOn="Đã giao"
        labelOff="Chưa giao"
      />
    </div>
  );
}

function RowActions({
  order,
  currentUserId,
  onEdit,
}: {
  order: OrderRow;
  currentUserId: string;
  onEdit: (order: OrderRow) => void;
}) {
  const { apply } = useOrders();
  const [pending, startTransition] = useTransition();

  // Đơn tạm (đang lưu) chưa có id thật -> chưa cho sửa/xoá.
  if (order.seller_id !== currentUserId || order.id.startsWith(TMP_PREFIX)) return null;

  function handleDelete() {
    startTransition(async () => {
      apply({ type: "remove", id: order.id });
      await deleteOrder(order.id);
    });
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-foreground"
        aria-label="Sửa đơn"
        disabled={pending}
        onClick={() => onEdit(order)}
      >
        <Pencil />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        aria-label="Xoá đơn"
        disabled={pending}
        onClick={handleDelete}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </Button>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-xs font-medium whitespace-nowrap transition-all select-none active:scale-[0.97]",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PendingOrdersTable({ prices }: { prices: Record<PriceGroup, Price> }) {
  const { orders: allOrders, currentUserId, selectedDot, viewNext } = useOrders();
  // Chỉ đơn thuộc đợt đang xem (hiện tại / kế tiếp).
  const orders = useMemo(() => allOrders.filter((o) => o.dot === selectedDot), [allOrders, selectedDot]);
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(new Set());
  const [sellerFilter, setSellerFilter] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);

  function toggleFilter(filter: StatusFilter) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }

  // Người tạo có mặt trong đợt (distinct theo seller_id), mình đứng đầu.
  const sellers = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of orders) {
      if (!map.has(o.seller_id)) map.set(o.seller_id, o.profiles?.full_name ?? "Không rõ");
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort(
      (a, b) =>
        Number(b.id === currentUserId) - Number(a.id === currentUserId) ||
        a.name.localeCompare(b.name, "vi"),
    );
  }, [orders, currentUserId]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (q && !o.ten_nguoi_mua.toLowerCase().includes(q)) return false;
      if (statusFilters.has("chua_thanh_toan") && o.da_thanh_toan) return false;
      if (statusFilters.has("chua_giao") && o.da_giao) return false;
      if (sellerFilter && o.seller_id !== sellerFilter) return false;
      return true;
    });
  }, [orders, search, statusFilters, sellerFilter]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-10 text-center">
        <ReceiptText className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          Chưa có đơn nào trong đợt {viewNext ? "kế tiếp" : "này"}. Dùng &quot;Nhập nhanh&quot; ở trên
          để bắt đầu.
        </p>
      </div>
    );
  }

  const totals = calcTotals(orders);
  const productTotals = calcProductTotals(orders);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên người mua..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-1.5">
          <FilterChip
            active={statusFilters.has("chua_thanh_toan")}
            onClick={() => toggleFilter("chua_thanh_toan")}
          >
            Chưa thanh toán
          </FilterChip>
          <FilterChip
            active={statusFilters.has("chua_giao")}
            onClick={() => toggleFilter("chua_giao")}
          >
            Chưa giao
          </FilterChip>
        </div>
      </div>

      {sellers.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="shrink-0 text-xs text-muted-foreground">Người tạo:</span>
          {sellers.map((s) => (
            <FilterChip
              key={s.id}
              active={sellerFilter === s.id}
              onClick={() => setSellerFilter((prev) => (prev === s.id ? null : s.id))}
            >
              {s.id === currentUserId ? `${s.name} (bạn)` : s.name}
            </FilterChip>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-8 text-center">
          <Search className="size-6 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Không tìm thấy đơn nào khớp bộ lọc.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="flex flex-col gap-2.5 md:hidden">
            {filteredOrders.map((order, i) => {
              const tmp = order.id.startsWith(TMP_PREFIX);
              return (
                <li
                  key={order.id}
                  className={cn(
                    "flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-3 animate-in fade-in slide-in-from-bottom-1 duration-300",
                    tmp && "animate-pulse opacity-60",
                  )}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{order.ten_nguoi_mua}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {order.profiles?.full_name ?? "—"} · {formatDateTime(order.created_at)}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatVnd(orderTienBan(order))}
                    </span>
                  </div>
                  <SoLuongChips q={order} />
                  {order.ghi_chu && (
                    <p className="text-xs text-muted-foreground italic">{order.ghi_chu}</p>
                  )}
                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                    <StatusPair order={order} />
                    <div className="flex gap-0.5">
                      {!tmp && <PaymentQrButton order={order} />}
                      <RowActions order={order} currentUserId={currentUserId} onEdit={setEditingOrder} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 text-xs text-muted-foreground">Người mua</TableHead>
                  <TableHead className="h-9 text-xs text-muted-foreground">Số lượng</TableHead>
                  <TableHead className="h-9 text-xs text-muted-foreground">Trạng thái</TableHead>
                  <TableHead className="h-9 text-right text-xs text-muted-foreground">Tiền bán</TableHead>
                  <TableHead className="h-9 w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, i) => {
                  const tmp = order.id.startsWith(TMP_PREFIX);
                  return (
                    <TableRow
                      key={order.id}
                      className={cn(
                        "border-border/60 animate-in fade-in slide-in-from-left-1 duration-300",
                        tmp && "animate-pulse opacity-60",
                      )}
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
                    >
                      <TableCell className="max-w-64 whitespace-normal">
                        <div className="font-medium">{order.ten_nguoi_mua}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {order.profiles?.full_name ?? "—"} · {formatDateTime(order.created_at)}
                        </div>
                        {order.ghi_chu && (
                          <div className="mt-0.5 text-xs text-muted-foreground italic">{order.ghi_chu}</div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <SoLuongChips q={order} />
                      </TableCell>
                      <TableCell>
                        <StatusPair order={order} />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatVnd(orderTienBan(order))}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-0.5">
                          {!tmp && <PaymentQrButton order={order} />}
                          <RowActions order={order} currentUserId={currentUserId} onEdit={setEditingOrder} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2 border-t border-border/60 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <SoLuongChips q={productTotals} />
        <p className="shrink-0 text-muted-foreground sm:text-right">
          Tổng {totals.soLuongTong} phần · dự kiến bán{" "}
          <span className="font-medium text-foreground tabular-nums">{formatVnd(totals.tienBan)}</span>
        </p>
      </div>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa đơn</DialogTitle>
            <DialogDescription>Cập nhật thông tin người mua và số lượng.</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <OrderForm prices={prices} order={editingOrder} onSuccess={() => setEditingOrder(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
