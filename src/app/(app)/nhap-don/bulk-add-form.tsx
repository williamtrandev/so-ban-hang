"use client";

import { useActionState, useRef, useEffect, useState, useMemo } from "react";
import { ListPlus, CircleCheck, CircleAlert } from "lucide-react";
import { createBulkOrders } from "./actions";
import { parseBulkOrders } from "./parse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatVnd, type Price, type PriceGroup } from "@/lib/domain/types";

export function BulkAddForm({ prices }: { prices: Record<PriceGroup, Price> }) {
  const [error, formAction, pending] = useActionState(createBulkOrders, null);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        placeholder={"Cô Bảy chợ Xổm, 2, 1, 3\nAnh Tư, 0, 0, 5\nChị Ba, 1"}
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
