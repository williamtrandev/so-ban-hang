"use client";

import { createContext, useContext, useOptimistic, type ReactNode } from "react";
import type { OrderRow, Price, PriceGroup } from "@/lib/domain/types";
import type { ParsedOrder } from "./parse";

export const TMP_PREFIX = "tmp-";

type OptimisticAction = { type: "add"; orders: OrderRow[] } | { type: "remove"; id: string };

type OrdersContextValue = {
  orders: OrderRow[];
  currentUserId: string;
  apply: (action: OptimisticAction) => void;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

// Dựng 1 OrderRow tạm để hiện ngay khi user vừa thêm, trước khi server trả về.
export function toOptimisticOrder(
  o: ParsedOrder,
  sellerId: string,
  prices: Record<PriceGroup, Price>,
): OrderRow {
  return {
    id: `${TMP_PREFIX}${crypto.randomUUID()}`,
    seller_id: sellerId,
    ten_nguoi_mua: o.ten_nguoi_mua,
    so_luong_nem_an_lien: o.so_luong_nem_an_lien,
    so_luong_nem_moi: o.so_luong_nem_moi,
    so_luong_bi: o.so_luong_bi,
    so_luong_cha: o.so_luong_cha,
    ghi_chu: o.ghi_chu,
    da_thanh_toan: o.da_thanh_toan,
    da_giao: o.da_giao,
    gia_goc_nem_bi_snap: prices.nem_bi?.gia_goc ?? 0,
    gia_ban_nem_bi_snap: prices.nem_bi?.gia_ban ?? 0,
    gia_goc_cha_snap: prices.cha?.gia_goc ?? 0,
    gia_ban_cha_snap: prices.cha?.gia_ban ?? 0,
    settlement_id: null,
    created_at: new Date().toISOString(),
    profiles: { full_name: "Bạn" },
  };
}

export function OrdersProvider({
  orders,
  currentUserId,
  children,
}: {
  orders: OrderRow[];
  currentUserId: string;
  children: ReactNode;
}) {
  const [optimisticOrders, apply] = useOptimistic(
    orders,
    (state, action: OptimisticAction) => {
      if (action.type === "add") return [...action.orders, ...state];
      return state.filter((o) => o.id !== action.id);
    },
  );

  return (
    <OrdersContext.Provider value={{ orders: optimisticOrders, currentUserId, apply }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders phải nằm trong <OrdersProvider>");
  return ctx;
}
