"use client";

import {
  createContext,
  useContext,
  useMemo,
  useOptimistic,
  useState,
  type ReactNode,
} from "react";
import { currentRound, type OrderRow, type Price, type PriceGroup } from "@/lib/domain/types";
import type { ParsedOrder } from "./parse";

export const TMP_PREFIX = "tmp-";

type OptimisticAction = { type: "add"; orders: OrderRow[] } | { type: "remove"; id: string };

type OrdersContextValue = {
  orders: OrderRow[];
  currentUserId: string;
  apply: (action: OptimisticAction) => void;
  // Quản lý đợt: đang xem/nhập đợt hiện tại hay đợt kế tiếp.
  currentRound: number;
  selectedDot: number;
  viewNext: boolean;
  setViewNext: (next: boolean) => void;
  hasNext: boolean;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

// Dựng 1 OrderRow tạm để hiện ngay khi user vừa thêm, trước khi server trả về.
export function toOptimisticOrder(
  o: ParsedOrder,
  sellerId: string,
  prices: Record<PriceGroup, Price>,
  dot: number,
): OrderRow {
  return {
    id: `${TMP_PREFIX}${crypto.randomUUID()}`,
    seller_id: sellerId,
    ten_nguoi_mua: o.ten_nguoi_mua,
    so_luong_nem_an_lien_la: o.so_luong_nem_an_lien_la,
    so_luong_nem_an_lien_hop: o.so_luong_nem_an_lien_hop,
    so_luong_nem_moi_la: o.so_luong_nem_moi_la,
    so_luong_nem_moi_hop: o.so_luong_nem_moi_hop,
    so_luong_bi_la: o.so_luong_bi_la,
    so_luong_bi_hop: o.so_luong_bi_hop,
    so_luong_cha: o.so_luong_cha,
    ghi_chu: o.ghi_chu,
    da_thanh_toan: o.da_thanh_toan,
    da_giao: o.da_giao,
    gia_goc_nem_bi_snap: prices.nem_bi?.gia_goc ?? 0,
    gia_ban_nem_bi_snap: prices.nem_bi?.gia_ban ?? 0,
    gia_goc_cha_snap: prices.cha?.gia_goc ?? 0,
    gia_ban_cha_snap: prices.cha?.gia_ban ?? 0,
    settlement_id: null,
    dot,
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
  const [viewNext, setViewNext] = useState(false);

  const round = currentRound(optimisticOrders);
  const selectedDot = round + (viewNext ? 1 : 0);
  const hasNext = useMemo(
    () => optimisticOrders.some((o) => o.dot > round),
    [optimisticOrders, round],
  );

  return (
    <OrdersContext.Provider
      value={{
        orders: optimisticOrders,
        currentUserId,
        apply,
        currentRound: round,
        selectedDot,
        viewNext,
        setViewNext,
        hasNext,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders phải nằm trong <OrdersProvider>");
  return ctx;
}
