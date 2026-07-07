"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { createOrder, updateOrder } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  formatVnd,
  orderSoLuongNem,
  orderSoLuongBi,
  zeroSoLuong,
  type OrderRow,
  type Price,
  type PriceGroup,
  type SoLuong,
} from "@/lib/domain/types";

type QtyKey = keyof SoLuong;

const QUANTITY_FIELDS: { key: QtyKey; label: string; group: PriceGroup }[] = [
  { key: "so_luong_nem_an_lien_la", label: "Nem ăn liền lá", group: "nem_bi" },
  { key: "so_luong_nem_an_lien_hop", label: "Nem ăn liền hộp", group: "nem_bi" },
  { key: "so_luong_nem_moi_la", label: "Nem mới lá", group: "nem_bi" },
  { key: "so_luong_nem_moi_hop", label: "Nem mới hộp", group: "nem_bi" },
  { key: "so_luong_bi_la", label: "Bì lá", group: "nem_bi" },
  { key: "so_luong_bi_hop", label: "Bì hộp", group: "nem_bi" },
  { key: "so_luong_cha", label: "Chả", group: "cha" },
];

export function OrderForm({
  prices,
  order,
  onSuccess,
}: {
  prices: Record<PriceGroup, Price>;
  order?: OrderRow;
  onSuccess?: () => void;
}) {
  const isEdit = !!order;
  const action = isEdit ? updateOrder.bind(null, order.id) : createOrder;
  const [error, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);
  const [qty, setQty] = useState<SoLuong>(() => {
    const q = zeroSoLuong();
    if (order) for (const f of QUANTITY_FIELDS) q[f.key] = order[f.key];
    return q;
  });

  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
      return;
    }
    if (submittedRef.current && !error) {
      submittedRef.current = false;
      if (!isEdit) {
        formRef.current?.reset();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQty(zeroSoLuong());
      }
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, error, onSuccess]);

  function bump(key: QtyKey, delta: number) {
    setQty((q) => ({ ...q, [key]: Math.max(0, q[key] + delta) }));
  }

  function setDirect(key: QtyKey, raw: string) {
    const n = parseInt(raw, 10);
    setQty((q) => ({ ...q, [key]: Number.isNaN(n) || n < 0 ? 0 : n }));
  }

  const tongTien =
    (orderSoLuongNem(qty) + orderSoLuongBi(qty)) * (prices.nem_bi?.gia_ban ?? 0) +
    qty.so_luong_cha * (prices.cha?.gia_ban ?? 0);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ten_nguoi_mua">Tên người mua</Label>
        <Input
          id="ten_nguoi_mua"
          name="ten_nguoi_mua"
          type="text"
          required
          autoComplete="off"
          autoFocus
          defaultValue={order?.ten_nguoi_mua}
          placeholder="Ví dụ: Cô Bảy chợ Xổm"
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {QUANTITY_FIELDS.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
          >
            <div className="flex flex-col">
              <Label htmlFor={f.key} className="text-sm">
                {f.label}
              </Label>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {formatVnd(prices[f.group]?.gia_ban ?? 0)} / phần
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Bớt 1 ${f.label}`}
                disabled={qty[f.key] === 0}
                onClick={() => bump(f.key, -1)}
              >
                <Minus />
              </Button>
              <Input
                id={f.key}
                name={f.key}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={qty[f.key]}
                onChange={(e) => setDirect(f.key, e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-16 text-center tabular-nums"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Thêm 1 ${f.label}`}
                onClick={() => bump(f.key, 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ghi_chu">Ghi chú</Label>
        <Textarea
          id="ghi_chu"
          name="ghi_chu"
          rows={2}
          defaultValue={order?.ghi_chu ?? ""}
          placeholder="Ví dụ: giao buổi chiều, gói riêng..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label
          htmlFor="da_thanh_toan"
          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 px-3 py-2.5 transition-colors has-[[data-checked]]:border-primary/40 has-[[data-checked]]:bg-primary/5"
        >
          <Checkbox id="da_thanh_toan" name="da_thanh_toan" defaultChecked={order?.da_thanh_toan} />
          <span className="text-sm">Đã thanh toán</span>
        </label>
        <label
          htmlFor="da_giao"
          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 px-3 py-2.5 transition-colors has-[[data-checked]]:border-primary/40 has-[[data-checked]]:bg-primary/5"
        >
          <Checkbox id="da_giao" name="da_giao" defaultChecked={order?.da_giao} />
          <span className="text-sm">Đã giao</span>
        </label>
      </div>

      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Tổng tiền bán</span>
        <span className="text-lg font-semibold tabular-nums text-primary">{formatVnd(tongTien)}</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending || tongTien === 0}>
        {pending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm đơn"}
      </Button>
    </form>
  );
}
