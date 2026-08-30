"use client";

import { useActionState, useRef, useEffect, useState, useMemo } from "react";
import { Zap } from "lucide-react";
import { createBulkOrders } from "./actions";
import { parseBulkOrders } from "./parse";
import { useOrders, toOptimisticOrder } from "./orders-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatVnd,
  soLuongLabel,
  tienBanTheoGia,
  type Price,
  type PriceGroup,
} from "@/lib/domain/types";

export function QuickAddForm({ prices }: { prices: Record<PriceGroup, Price> }) {
  const { apply, currentUserId, selectedDot, viewNext } = useOrders();
  const [error, formAction, pending] = useActionState(
    async (prev: string | null, formData: FormData) => {
      // Dispatch optimistic TRONG transition đang await server -> đơn giữ hiện tới khi xong.
      const r = parseBulkOrders(String(formData.get("bulk_text") ?? ""))[0];
      if (r?.ok) {
        apply({
          type: "add",
          orders: [toOptimisticOrder(r.order, currentUserId, prices, selectedDot)],
        });
      }
      return createBulkOrders(prev, formData);
    },
    null,
  );
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  const result = useMemo(() => parseBulkOrders(text)[0], [text]);

  const tongTien = useMemo(
    () => (result?.ok ? tienBanTheoGia(result.order, prices) : 0),
    [result, prices],
  );

  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
      return;
    }
    if (submittedRef.current && !error) {
      submittedRef.current = false;
      setText("");
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [pending, error]);

  const canSubmit = !!result?.ok && !pending;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="next_batch" value={viewNext ? "on" : "off"} />
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          name="bulk_text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          autoFocus
          placeholder="Cô Bảy chợ Xổm, 2nl, 1nmh, 1bl, 1c, 2cc, 1kl, tt, giao, gói riêng"
          className="font-mono tabular-nums"
        />
        <Button type="submit" disabled={!canSubmit}>
          <Zap className="size-4" />
          {pending ? "Đang lưu..." : "Thêm"}
        </Button>
      </div>

      <div className="flex min-h-5 items-center justify-between gap-3 text-sm">
        {result?.ok ? (
          <span className="truncate text-muted-foreground">
            <span className="font-medium text-foreground">{result.order.ten_nguoi_mua}</span> —{" "}
            {soLuongLabel(result.order)}
            {result.order.da_thanh_toan && <span className="text-primary"> · TT</span>}
            {result.order.da_giao && <span className="text-primary"> · Giao</span>}
            {result.order.ghi_chu && (
              <span className="italic"> · &ldquo;{result.order.ghi_chu}&rdquo;</span>
            )}
          </span>
        ) : result && !result.ok ? (
          <span className="truncate text-destructive">{result.error}</span>
        ) : (
          <span className="truncate text-muted-foreground">
            Cú pháp: Tên, 2nl, 1nmh, 1bl, 1c, 2cc, 1kl, [tt], [giao] · nl/nh=nem ăn liền lá/hộp,
            nml/nmh=nem mới lá/hộp, bl/bh=bì lá/hộp, c=chả, cc=chuối chiên, kl=khoai lang chiên
          </span>
        )}
        {tongTien > 0 && (
          <span className="shrink-0 font-semibold tabular-nums text-primary">
            {formatVnd(tongTien)}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
