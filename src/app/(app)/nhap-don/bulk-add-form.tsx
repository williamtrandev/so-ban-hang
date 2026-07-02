"use client";

import { useActionState, useRef, useEffect, useState, useMemo } from "react";
import { ListPlus, CircleCheck, CircleAlert } from "lucide-react";
import { createBulkOrders } from "./actions";
import { parseBulkOrders } from "./parse";
import { useOrders, toOptimisticOrder } from "./orders-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatVnd, type Price, type PriceGroup } from "@/lib/domain/types";

export function BulkAddForm({ prices }: { prices: Record<PriceGroup, Price> }) {
  const { apply, currentUserId } = useOrders();
  const [error, formAction, pending] = useActionState(
    async (prev: string | null, formData: FormData) => {
      // Dispatch optimistic TRONG transition đang await server.
      const rows = parseBulkOrders(String(formData.get("bulk_text") ?? ""));
      const ok = rows.filter((r) => r.ok);
      if (ok.length > 0 && ok.length === rows.length) {
        apply({
          type: "add",
          orders: ok.map((r) =>
            toOptimisticOrder((r as Extract<typeof r, { ok: true }>).order, currentUserId, prices),
          ),
        });
      }
      return createBulkOrders(prev, formData);
    },
    null,
  );
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  const parsed = useMemo(() => parseBulkOrders(text), [text]);
  const okRows = parsed.filter((r) => r.ok);
  const badRows = parsed.filter((r) => !r.ok);

  const tongTien = useMemo(
    () =>
      okRows.reduce((sum, r) => {
        if (!r.ok) return sum;
        const o = r.order;
        return (
          sum +
          (o.so_luong_nem + o.so_luong_bi) * (prices.nem_bi?.gia_ban ?? 0) +
          o.so_luong_cha * (prices.cha?.gia_ban ?? 0)
        );
      }, 0),
    [okRows, prices],
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
    }
  }, [pending, error]);

  const canSubmit = okRows.length > 0 && badRows.length === 0 && !pending;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <Textarea
        name="bulk_text"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        placeholder={
          "Cô Bảy chợ Xổm, 2, 1, 3, tt, giao, gói riêng\nAnh Tư, 0, 0, 5, tt\nChị Ba, 1, , , , giao chiều"
        }
        className="font-mono text-sm tabular-nums"
      />

      {parsed.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
          {parsed.map((r) =>
            r.ok ? (
              <div key={r.line} className="flex items-center gap-2">
                <CircleCheck className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">
                  <span className="font-medium">{r.order.ten_nguoi_mua}</span>
                  <span className="text-muted-foreground">
                    {" — "}
                    nem {r.order.so_luong_nem}, bì {r.order.so_luong_bi}, chả{" "}
                    {r.order.so_luong_cha}
                  </span>
                  {r.order.da_thanh_toan && <span className="text-primary"> · TT</span>}
                  {r.order.da_giao && <span className="text-primary"> · Giao</span>}
                  {r.order.ghi_chu && (
                    <span className="text-muted-foreground italic"> · &ldquo;{r.order.ghi_chu}&rdquo;</span>
                  )}
                </span>
              </div>
            ) : (
              <div key={r.line} className="flex items-center gap-2 text-destructive">
                <CircleAlert className="size-3.5 shrink-0" />
                <span className="truncate">
                  Dòng {r.line}: {r.error}
                </span>
              </div>
            ),
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {okRows.length > 0 && (
            <>
              <span className="font-medium text-foreground">{okRows.length}</span> đơn ·{" "}
              <span className="font-semibold tabular-nums text-primary">{formatVnd(tongTien)}</span>
            </>
          )}
        </div>
        <Button type="submit" disabled={!canSubmit}>
          <ListPlus className="size-4" />
          {pending ? "Đang lưu..." : `Lưu ${okRows.length || ""} đơn`}
        </Button>
      </div>
    </form>
  );
}
