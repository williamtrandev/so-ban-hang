"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { createOrder } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatVnd, type Price, type PriceGroup } from "@/lib/domain/types";

type QtyKey = "nem" | "bi" | "cha";

const FIELDS: { key: QtyKey; name: string; label: string; group: PriceGroup }[] = [
  { key: "nem", name: "so_luong_nem", label: "Nem", group: "nem_bi" },
  { key: "bi", name: "so_luong_bi", label: "Bì", group: "nem_bi" },
  { key: "cha", name: "so_luong_cha", label: "Chả", group: "cha" },
];

export function QuickAddForm({ prices }: { prices: Record<PriceGroup, Price> }) {
  const [error, formAction, pending] = useActionState(createOrder, null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const [qty, setQty] = useState<Record<QtyKey, number>>({ nem: 0, bi: 0, cha: 0 });

  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
      return;
    }
    if (submittedRef.current && !error) {
      submittedRef.current = false;
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQty({ nem: 0, bi: 0, cha: 0 });
      nameRef.current?.focus();
    }
  }, [pending, error]);

  function setDirect(key: QtyKey, raw: string) {
    const n = parseInt(raw, 10);
    setQty((q) => ({ ...q, [key]: Number.isNaN(n) || n < 0 ? 0 : n }));
  }

  const tongTien =
    (qty.nem + qty.bi) * (prices.nem_bi?.gia_ban ?? 0) + qty.cha * (prices.cha?.gia_ban ?? 0);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="flex min-w-[9rem] flex-1 flex-col gap-1.5">
        <Label htmlFor="qa_ten" className="text-xs text-muted-foreground">
          Tên người mua
        </Label>
        <Input
          ref={nameRef}
          id="qa_ten"
          name="ten_nguoi_mua"
          type="text"
          required
          autoComplete="off"
          placeholder="Cô Bảy chợ Xổm"
        />
      </div>

      {FIELDS.map((f) => (
        <div key={f.key} className="flex w-[4.5rem] flex-col gap-1.5">
          <Label htmlFor={`qa_${f.key}`} className="text-xs text-muted-foreground">
            {f.label}
          </Label>
          <Input
            id={`qa_${f.key}`}
            name={f.name}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={qty[f.key] || ""}
            placeholder="0"
            onChange={(e) => setDirect(f.key, e.target.value)}
            onFocus={(e) => e.target.select()}
            className="text-center tabular-nums"
          />
        </div>
      ))}

      <div className="flex items-center gap-3 sm:mb-2.5">
        <label htmlFor="qa_tt" className="flex cursor-pointer items-center gap-1.5 text-sm">
          <Checkbox id="qa_tt" name="da_thanh_toan" />
          <span>TT</span>
        </label>
        <label htmlFor="qa_giao" className="flex cursor-pointer items-center gap-1.5 text-sm">
          <Checkbox id="qa_giao" name="da_giao" />
          <span>Giao</span>
        </label>
      </div>

      <div className="flex items-center gap-3 sm:ml-auto">
        <span className="text-sm font-semibold tabular-nums text-primary">{formatVnd(tongTien)}</span>
        <Button type="submit" disabled={pending || tongTien === 0}>
          <Zap className="size-4" />
          {pending ? "Đang lưu..." : "Thêm nhanh"}
        </Button>
      </div>

      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}
