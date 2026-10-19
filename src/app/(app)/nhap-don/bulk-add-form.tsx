"use client";

import { useActionState, useRef, useEffect, useState, useMemo } from "react";
import { ListPlus, CircleCheck, CircleAlert } from "lucide-react";
import { createBulkOrders } from "./actions";
import { parseBulkOrders } from "./parse";
import { useOrders, toOptimisticOrder } from "./orders-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatVnd,
  soLuongLabel,
  tienBanTheoGia,
  type Price,
  type PriceGroup,
} from "@/lib/domain/types";

export function BulkAddForm({ prices }: { prices: Record<PriceGroup, Price> }) {
  const { apply, currentUserId, selectedDot, viewNext } = useOrders();
  const [error, formAction, pending] = useActionState(
    async (prev: string | null, formData: FormData) => {
      // Dispatch optimistic TRONG transition đang await server.
      const rows = parseBulkOrders(String(formData.get("bulk_text") ?? ""));
      const ok = rows.filter((r) => r.ok);
      if (ok.length > 0 && ok.length === rows.length) {
        apply({
          type: "add",
          orders: ok.map((r) =>
            toOptimisticOrder(
              (r as Extract<typeof r, { ok: true }>).order,
              currentUserId,
              prices,
              selectedDot,
            ),
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
    () => okRows.reduce((sum, r) => (r.ok ? sum + tienBanTheoGia(r.order, prices) : sum), 0),
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
      <input type="hidden" name="next_batch" value={viewNext ? "on" : "off"} />
      <Textarea
        name="bulk_text"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        placeholder={
          "Cô Bảy chợ Xổm, 2nl, 1nmh, 1bl, 1c, tt, giao, gói riêng\nAnh Tư, 5c, 2cc, tt\nChị Ba, 1nmh, 2bh, 3kl, giao chiều"
        }
        className="font-mono text-sm tabular-nums"
      />
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {[
          ["nl / nh", "nem ăn liền lá / hộp"],
          ["nml / nmh", "nem mới lá / hộp"],
          ["bl / bh", "bì lá / hộp"],
          ["c", "chả"],
          ["cc", "chuối chiên"],
          ["kl", "khoai lang chiên"],
          ["tt", "đã thanh toán"],
          ["giao", "đã giao"],
        ].map(([code, label]) => (
          <span key={code}>
            <code className="font-medium text-foreground">{code}</code> {label}
          </span>
        ))}
      </p>

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
                    {soLuongLabel(r.order)}
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
