"use client";

import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { ReceiptText, Trash2, Pencil, Search, Repeat2, X } from "lucide-react";
import { deleteOrder } from "./actions";
import { OrderForm } from "./order-form";
import { useOrders, TMP_PREFIX } from "./orders-provider";
import { quickTextFromOrder } from "./parse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  calcTotals,
  calcProductTotals,
  orderTienBan,
  type OrderRow,
  type Price,
  type PriceGroup,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const UNDO_MS = 5000;
const PAGE = 20;
const TZ = "Asia/Ho_Chi_Minh";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dayLabelFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit" });

function dayLabel(key: string, sample: string): string {
  const today = dayKeyFmt.format(new Date());
  const yesterday = dayKeyFmt.format(new Date(Date.now() - 86_400_000));
  if (key === today) return "Hôm nay";
  if (key === yesterday) return "Hôm qua";
  const s = dayLabelFmt.format(new Date(sample));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Đơn đã sắp mới nhất trước; gom liên tiếp theo ngày (giờ VN).
function groupByDay(orders: OrderRow[]) {
  const groups: { key: string; label: string; orders: OrderRow[] }[] = [];
  for (const o of orders) {
    const key = dayKeyFmt.format(new Date(o.created_at));
    let g = groups.at(-1);
    if (!g || g.key !== key) {
      g = { key, label: dayLabel(key, o.created_at), orders: [] };
      groups.push(g);
    }
    g.orders.push(o);
  }
  return groups;
}

function StatusPair({ order }: { order: OrderRow }) {
  return (
    <div className="flex gap-1.5">
      <StatusToggle order={order} field="da_thanh_toan" labelOn="Đã TT" labelOff="Chưa TT" />
      <StatusToggle order={order} field="da_giao" labelOn="Đã giao" labelOff="Chưa giao" />
    </div>
  );
}

function RowActions({ order, onEdit }: { order: OrderRow; onEdit: (order: OrderRow) => void }) {
  const { currentUserId, hide, unhide, setDraft } = useOrders();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Đơn tạm (đang lưu) chưa có id thật -> chưa thao tác được.
  if (order.id.startsWith(TMP_PREFIX)) return null;
  const mine = order.seller_id === currentUserId;

  // Đã xác nhận: ẩn ngay, vẫn cho hoàn tác 5s phòng bấm nhầm rồi mới xoá thật.
  function handleDelete() {
    setConfirmOpen(false);
    hide(order.id);
    let settled = false;
    const commit = () => {
      if (settled) return;
      settled = true;
      deleteOrder(order.id).then((error) => {
        if (!error) return;
        unhide(order.id);
        toast.error(`Chưa xoá được đơn ${order.ten_nguoi_mua}: ${error}`);
      });
    };
    toast(`Đã xoá đơn ${order.ten_nguoi_mua}`, {
      duration: UNDO_MS,
      action: {
        label: "Hoàn tác",
        onClick: () => {
          settled = true;
          unhide(order.id);
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    });
  }

  function handleRepeat() {
    setDraft(quickTextFromOrder(order.ten_nguoi_mua, order, order.ghi_chu));
  }

  return (
    <div className="flex gap-0.5">
      <PaymentQrButton order={order} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-primary"
        aria-label="Lặp lại đơn"
        title="Lặp lại đơn này"
        onClick={handleRepeat}
      >
        <Repeat2 />
      </Button>
      {mine && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Sửa đơn"
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
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 />
          </Button>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Xoá đơn này?</DialogTitle>
                <DialogDescription>Đơn sẽ bị xoá khỏi đợt hiện tại.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{order.ten_nguoi_mua}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatVnd(orderTienBan(order))}</span>
                </div>
                <SoLuongChips q={order} />
                {order.ghi_chu && <p className="text-xs text-muted-foreground italic">{order.ghi_chu}</p>}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                  Huỷ
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  <Trash2 />
                  Xoá đơn
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all select-none active:scale-[0.97]",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("tabular-nums", active ? "opacity-80" : "opacity-60")}>{count}</span>
      )}
    </button>
  );
}

export function PendingOrdersTable({ prices }: { prices: Record<PriceGroup, Price> }) {
  const {
    roundOrders,
    filteredOrders,
    currentUserId,
    viewNext,
    search,
    setSearch,
    statusFilters,
    toggleStatusFilter,
    sellerView,
    setSellerView,
  } = useOrders();
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  // Đổi bộ lọc thì quay về trang đầu; thêm/sửa đơn thì giữ nguyên số đang xem.
  const filterKey = [search, sellerView, ...statusFilters, viewNext].join("|");
  const [page, setPage] = useState({ key: filterKey, limit: PAGE });
  const limit = page.key === filterKey ? page.limit : PAGE;

  // Người khác có đơn trong đợt (mình đã có chip "Của tôi" riêng).
  const others = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const o of roundOrders) {
      if (o.seller_id === currentUserId) continue;
      const hit = map.get(o.seller_id);
      if (hit) hit.count += 1;
      else map.set(o.seller_id, { name: o.profiles?.full_name ?? "Không rõ", count: 1 });
    }
    return Array.from(map, ([id, v]) => ({ id, ...v })).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [roundOrders, currentUserId]);
  const mineCount = roundOrders.length - others.reduce((n, s) => n + s.count, 0);

  if (roundOrders.length === 0) {
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

  const totals = calcTotals(filteredOrders);
  const productTotals = calcProductTotals(filteredOrders);
  const unpaid = filteredOrders.filter((o) => !o.da_thanh_toan).length;
  const isFiltered = filteredOrders.length !== roundOrders.length;
  const scopeLabel =
    sellerView === "mine" ? "Của tôi" : sellerView === "all" ? "Tất cả" : (others.find((s) => s.id === sellerView)?.name ?? "Đã lọc");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm người mua..."
            className="pr-8 pl-8"
          />
          {search && (
            <button
              type="button"
              aria-label="Xoá tìm kiếm"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          <FilterChip
            active={statusFilters.has("chua_thanh_toan")}
            onClick={() => toggleStatusFilter("chua_thanh_toan")}
          >
            Chưa thanh toán
          </FilterChip>
          <FilterChip active={statusFilters.has("chua_giao")} onClick={() => toggleStatusFilter("chua_giao")}>
            Chưa giao
          </FilterChip>
        </div>
      </div>

      {others.length > 0 && (
        <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
          <FilterChip active={sellerView === "mine"} onClick={() => setSellerView("mine")} count={mineCount}>
            Của tôi
          </FilterChip>
          <FilterChip active={sellerView === "all"} onClick={() => setSellerView("all")} count={roundOrders.length}>
            Tất cả
          </FilterChip>
          <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden="true" />
          {others.map((s) => (
            <FilterChip
              key={s.id}
              active={sellerView === s.id}
              onClick={() => setSellerView(sellerView === s.id ? "all" : s.id)}
              count={s.count}
            >
              {s.name}
            </FilterChip>
          ))}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/40 p-8 text-center">
          <Search className="size-6 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {sellerView === "mine" && mineCount === 0
              ? "Bạn chưa có đơn nào trong đợt này."
              : "Không có đơn nào khớp bộ lọc."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setSellerView("all");
              if (statusFilters.has("chua_thanh_toan")) toggleStatusFilter("chua_thanh_toan");
              if (statusFilters.has("chua_giao")) toggleStatusFilter("chua_giao");
            }}
          >
            Xem tất cả {roundOrders.length} đơn
          </Button>
        </div>
      ) : (
        <>
          {(() => {
            const shown = filteredOrders.slice(0, limit);
            const dayTotals = new Map<string, { count: number; tien: number }>();
            for (const o of filteredOrders) {
              const k = dayKeyFmt.format(new Date(o.created_at));
              const t = dayTotals.get(k) ?? { count: 0, tien: 0 };
              t.count += 1;
              t.tien += orderTienBan(o);
              dayTotals.set(k, t);
            }
            const groups = groupByDay(shown);
            const seller = (o: OrderRow) =>
              o.seller_id === currentUserId ? "Tôi" : (o.profiles?.full_name ?? "—");
            const DayHeader = ({ g }: { g: (typeof groups)[number] }) => {
              const t = dayTotals.get(g.key)!;
              return (
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-foreground/80" suppressHydrationWarning>
                    {g.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {t.count} đơn · {formatVnd(t.tien)}
                  </span>
                </div>
              );
            };

            return (
              <>
                {/* Mobile: card list */}
                <div className="flex flex-col gap-4 md:hidden">
                  {groups.map((g) => (
                    <section key={g.key} className="flex flex-col gap-2">
                      <div className="px-1">
                        <DayHeader g={g} />
                      </div>
                      <ul className="flex flex-col gap-2">
                        {g.orders.map((order) => {
                          const tmp = order.id.startsWith(TMP_PREFIX);
                          return (
                            <li
                              key={order.id}
                              className={cn(
                                "flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 animate-in fade-in duration-300",
                                !order.da_thanh_toan && "border-l-[3px] border-l-warning/70",
                                tmp && "animate-pulse opacity-60",
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium">{order.ten_nguoi_mua}</span>
                                  <span className="truncate text-xs text-muted-foreground tabular-nums">
                                    {seller(order)} · {timeFmt.format(new Date(order.created_at))}
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
                              <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                                <StatusPair order={order} />
                                <RowActions order={order} onEdit={setEditingOrder} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 text-xs text-muted-foreground">Người mua</TableHead>
                        <TableHead className="h-9 text-xs text-muted-foreground">Số lượng</TableHead>
                        <TableHead className="h-9 text-xs text-muted-foreground">Trạng thái</TableHead>
                        <TableHead className="h-9 text-right text-xs text-muted-foreground">Tiền bán</TableHead>
                        <TableHead className="h-9 w-36" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((g) => (
                        <Fragment key={g.key}>
                          <TableRow className="border-border/60 bg-muted/25 hover:bg-muted/25">
                            <TableCell colSpan={5} className="py-1.5">
                              <DayHeader g={g} />
                            </TableCell>
                          </TableRow>
                          {g.orders.map((order) => {
                            const tmp = order.id.startsWith(TMP_PREFIX);
                            return (
                              <TableRow
                                key={order.id}
                                className={cn(
                                  "border-border/60 animate-in fade-in duration-300",
                                  tmp && "animate-pulse opacity-60",
                                )}
                              >
                                <TableCell
                                  className={cn(
                                    "max-w-64 py-2 whitespace-normal",
                                    !order.da_thanh_toan && "shadow-[inset_3px_0_0_var(--color-warning)]",
                                  )}
                                >
                                  <div className="flex items-baseline gap-2">
                                    <span className="truncate font-medium">{order.ten_nguoi_mua}</span>
                                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                      {seller(order)} · {timeFmt.format(new Date(order.created_at))}
                                    </span>
                                  </div>
                                  {order.ghi_chu && (
                                    <div className="text-xs text-muted-foreground italic">{order.ghi_chu}</div>
                                  )}
                                </TableCell>
                                <TableCell className="py-2 whitespace-normal">
                                  <SoLuongChips q={order} />
                                </TableCell>
                                <TableCell className="py-2">
                                  <StatusPair order={order} />
                                </TableCell>
                                <TableCell className="py-2 text-right font-medium tabular-nums">
                                  {formatVnd(orderTienBan(order))}
                                </TableCell>
                                <TableCell className="py-1.5">
                                  <div className="flex justify-end">
                                    <RowActions order={order} onEdit={setEditingOrder} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredOrders.length > limit && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setPage({ key: filterKey, limit: limit + PAGE })}
                  >
                    Xem thêm {Math.min(PAGE, filteredOrders.length - limit)} đơn
                    <span className="text-muted-foreground tabular-nums">
                      (còn {filteredOrders.length - limit})
                    </span>
                  </Button>
                )}
              </>
            );
          })()}
        </>
      )}

      <div className="flex flex-col gap-2 border-t border-border/60 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <SoLuongChips q={productTotals} />
        <p className="shrink-0 text-muted-foreground sm:text-right">
          {isFiltered && <span className="font-medium text-foreground">{scopeLabel}: </span>}
          {totals.soLuongTong} phần · dự kiến bán{" "}
          <span className="font-medium text-foreground tabular-nums">{formatVnd(totals.tienBan)}</span>
        </p>
      </div>

      {/* Mobile: tổng luôn thấy, khỏi cuộn xuống cuối danh sách. */}
      {filteredOrders.length > 0 && (
        <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-background/85 px-4 py-2.5 shadow-[0_12px_32px_-12px_color-mix(in_oklch,var(--foreground)_35%,transparent)] backdrop-blur-xl md:hidden">
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[11px] text-muted-foreground">
              {scopeLabel} · {filteredOrders.length} đơn
              {unpaid > 0 && <span className="text-warning"> · {unpaid} chưa TT</span>}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{totals.soLuongTong} phần</span>
          </div>
          <span className="shrink-0 text-lg font-semibold text-primary tabular-nums">
            {formatVnd(totals.tienBan)}
          </span>
        </div>
      )}

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
