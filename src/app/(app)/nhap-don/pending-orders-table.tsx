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
import {
  formatVnd,
  formatDateTime,
  calcTotals,
  orderTienBan,
  soLuongLabel,
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
  const { orders, currentUserId } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(new Set());
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);

  function toggleFilter(filter: StatusFilter) {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (q && !o.ten_nguoi_mua.toLowerCase().includes(q)) return false;
      if (statusFilters.has("chua_thanh_toan") && o.da_thanh_toan) return false;
      if (statusFilters.has("chua_giao") && o.da_giao) return false;
      return true;
    });
  }, [orders, search, statusFilters]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-10 text-center">
        <ReceiptText className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">
          Chưa có đơn nào trong đợt này. Bấm &quot;Thêm đơn mới&quot; ở dưới để bắt đầu.
        </p>
      </div>
    );
  }

  const totals = calcTotals(orders);

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

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 p-8 text-center">
          <Search className="size-6 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Không tìm thấy đơn nào khớp bộ lọc.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="flex flex-col gap-3 md:hidden">
            {filteredOrders.map((order, i) => (
              <li
                key={order.id}
                className={cn(
                  "flex flex-col gap-2.5 rounded-lg border border-border/70 p-3 animate-in fade-in slide-in-from-bottom-1 duration-300",
                  order.id.startsWith(TMP_PREFIX) && "animate-pulse opacity-60",
                )}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{order.ten_nguoi_mua}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.profiles?.full_name ?? "—"} · {formatDateTime(order.created_at)}
                    </span>
                  </div>
                  <RowActions order={order} currentUserId={currentUserId} onEdit={setEditingOrder} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground tabular-nums">{soLuongLabel(order)}</span>
                  <span className="font-medium tabular-nums">{formatVnd(orderTienBan(order))}</span>
                </div>
                {order.ghi_chu && <p className="text-xs text-muted-foreground">{order.ghi_chu}</p>}
                <StatusPair order={order} />
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người mua</TableHead>
                  <TableHead>Người tạo</TableHead>
                  <TableHead>Lúc</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Tiền bán</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, i) => (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "animate-in fade-in slide-in-from-left-1 duration-300",
                      order.id.startsWith(TMP_PREFIX) && "animate-pulse opacity-60",
                    )}
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}
                  >
                    <TableCell className="font-medium">{order.ten_nguoi_mua}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {order.profiles?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {soLuongLabel(order)}
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground">
                      {order.ghi_chu || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusPair order={order} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVnd(orderTienBan(order))}
                    </TableCell>
                    <TableCell>
                      <RowActions order={order} currentUserId={currentUserId} onEdit={setEditingOrder} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <p className="text-right text-sm text-muted-foreground">
        Tổng {totals.soLuongTong} phần · dự kiến bán{" "}
        <span className="font-medium text-foreground tabular-nums">{formatVnd(totals.tienBan)}</span>
      </p>

      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="sm:max-w-lg">
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
