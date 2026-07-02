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
import { type Price, type PriceGroup } from "@/lib/domain/types";
import { toast } from "sonner";

const initialState: UpdatePricesState = { error: null, saved: false };

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
            giá nem, bì, chả.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">Nem / Bì</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="gia_goc_nem_bi">Giá gốc</Label>
                <Input
                  id="gia_goc_nem_bi"
                  name="gia_goc_nem_bi"
                  type="number"
                  min={0}
                  step={500}
                  defaultValue={prices.nem_bi?.gia_goc ?? 25000}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gia_ban_nem_bi">Giá bán</Label>
                <Input
                  id="gia_ban_nem_bi"
                  name="gia_ban_nem_bi"
                  type="number"
                  min={0}
                  step={500}
                  defaultValue={prices.nem_bi?.gia_ban ?? 35000}
                  required
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">Chả lụa</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="gia_goc_cha">Giá gốc</Label>
                <Input
                  id="gia_goc_cha"
                  name="gia_goc_cha"
                  type="number"
                  min={0}
                  step={500}
                  defaultValue={prices.cha?.gia_goc ?? 80000}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gia_ban_cha">Giá bán</Label>
                <Input
                  id="gia_ban_cha"
                  name="gia_ban_cha"
                  type="number"
                  min={0}
                  step={500}
                  defaultValue={prices.cha?.gia_ban ?? 100000}
                  required
                />
              </div>
            </div>
          </fieldset>
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
