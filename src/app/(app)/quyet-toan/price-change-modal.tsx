"use client";

import { useActionState, useEffect } from "react";
import { updatePrices, type UpdatePricesState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <form action={formAction} className="flex flex-col gap-5">
          {PRICE_GROUPS.map((g) => (
            <fieldset key={g} className="flex flex-col gap-3">
              <legend className="text-sm font-medium">{PRICE_FIELDS[g].label}</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`gia_goc_${g}`}>Giá gốc</Label>
                  <Input
                    id={`gia_goc_${g}`}
                    name={`gia_goc_${g}`}
                    type="number"
                    min={0}
                    step={500}
                    defaultValue={prices[g]?.gia_goc ?? PRICE_FIELDS[g].goc}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`gia_ban_${g}`}>Giá bán</Label>
                  <Input
                    id={`gia_ban_${g}`}
                    name={`gia_ban_${g}`}
                    type="number"
                    min={0}
                    step={500}
                    defaultValue={prices[g]?.gia_ban ?? PRICE_FIELDS[g].ban}
                    required
                  />
                </div>
              </div>
            </fieldset>
          ))}
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
