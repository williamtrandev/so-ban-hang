"use client";

import { useActionState, useEffect } from "react";
import { updatePrices, type UpdatePricesState } from "./actions";
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
import { PRICE_GROUPS, type Price, type PriceGroup } from "@/lib/domain/types";
import { toast } from "sonner";

const initialState: UpdatePricesState = { error: null, saved: false };

// Mỗi nhóm giá 1 khối "giá gốc / giá bán". Giá mặc định dùng khi chưa có giá cũ.
// Kiểu Record ép form luôn có đủ mọi nhóm (server từ chối nếu thiếu ô nào).
const PRICE_FIELDS: Record<PriceGroup, { label: string; goc: number; ban: number }> = {
  nem_bi: { label: "Nem / Bì", goc: 25000, ban: 35000 },
  cha: { label: "Chả lụa", goc: 80000, ban: 100000 },
  chuoi_chien: { label: "Chuối chiên", goc: 20000, ban: 25000 },
  khoai_lang_chien: { label: "Khoai lang chiên", goc: 30000, ban: 35000 },
};

export function PriceChangeModal({
  open,
  onOpenChange,
  prices,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prices: Record<PriceGroup, Price>;
}) {
  const [state, formAction, pending] = useActionState(updatePrices, initialState);

  useEffect(() => {
    if (state.saved) {
      toast.success("Đã cập nhật giá cho đợt mới.");
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.saved]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đợt mới: có đổi giá không?</DialogTitle>
          <DialogDescription>
            Vừa quyết toán xong. Xác nhận giá áp dụng cho đợt tiếp theo, hoặc sửa lại nếu cần đổi
            giá từng loại.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-center gap-2 bg-muted/40 px-3 py-2 text-xs text-muted-foreground sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
              <span>Món</span>
              <span>Giá gốc</span>
              <span>Giá bán</span>
            </div>
            {PRICE_GROUPS.map((g) => (
              <div
                key={g}
                className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-center gap-2 border-t border-border/60 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]"
              >
                <span className="truncate text-sm font-medium">{PRICE_FIELDS[g].label}</span>
                <Input
                  aria-label={`Giá gốc ${PRICE_FIELDS[g].label}`}
                  name={`gia_goc_${g}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  defaultValue={prices[g]?.gia_goc ?? PRICE_FIELDS[g].goc}
                  onFocus={(e) => e.target.select()}
                  className="tabular-nums"
                  required
                />
                <Input
                  aria-label={`Giá bán ${PRICE_FIELDS[g].label}`}
                  name={`gia_ban_${g}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  defaultValue={prices[g]?.gia_ban ?? PRICE_FIELDS[g].ban}
                  onFocus={(e) => e.target.select()}
                  className="tabular-nums"
                  required
                />
              </div>
            ))}
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Giữ nguyên giá cũ
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu giá mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
