"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  type ReactNode,
} from "react";
import {
  currentRound,
  priceSnapshot,
  type OrderRow,
  type Price,
  type PriceGroup,
} from "@/lib/domain/types";
import type { BuyerSuggestion } from "@/lib/domain/data";
import { foldVi } from "@/lib/utils";
import type { ParsedOrder } from "./parse";

export const TMP_PREFIX = "tmp-";

export type StatusFilter = "chua_thanh_toan" | "chua_giao";
// "mine" | "all" | seller_id của 1 người cụ thể.
export type SellerView = string;

type OptimisticAction =
  | { type: "add"; orders: OrderRow[] }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; patch: Partial<Pick<OrderRow, "da_thanh_toan" | "da_giao">> };

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
  // Đơn thuộc đợt đang xem (chưa lọc) và sau khi lọc.
  roundOrders: OrderRow[];
  filteredOrders: OrderRow[];
  search: string;
  setSearch: (s: string) => void;
  statusFilters: Set<StatusFilter>;
  toggleStatusFilter: (f: StatusFilter) => void;
  sellerView: SellerView;
  setSellerView: (v: SellerView) => void;
  // Đơn vừa bấm xoá, ẩn tạm trong lúc còn cho hoàn tác.
  hide: (id: string) => void;
  unhide: (id: string) => void;
  // Đổ sẵn 1 dòng vào ô nhập nhanh (lặp lại đơn).
  draft: string | null;
  setDraft: (text: string | null) => void;
  suggestions: BuyerSuggestion[];
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

const FILTER_KEY = "nhap-don:filters";

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
    so_luong_chuoi_chien: o.so_luong_chuoi_chien,
    so_luong_khoai_lang_chien: o.so_luong_khoai_lang_chien,
    ghi_chu: o.ghi_chu,
    da_thanh_toan: o.da_thanh_toan,
    da_giao: o.da_giao,
    ...priceSnapshot(prices),
    settlement_id: null,
    dot,
    created_at: new Date().toISOString(),
    profiles: { full_name: "Bạn" },
  };
}

export function OrdersProvider({
  orders,
  currentUserId,
  suggestions,
  children,
}: {
  orders: OrderRow[];
  currentUserId: string;
  suggestions: BuyerSuggestion[];
  children: ReactNode;
}) {
  const [optimisticOrders, apply] = useOptimistic(orders, (state, action: OptimisticAction) => {
    if (action.type === "add") return [...action.orders, ...state];
    if (action.type === "remove") return state.filter((o) => o.id !== action.id);
    return state.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o));
  });
  const [viewNext, setViewNext] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(new Set());
  const [sellerView, setSellerView] = useState<SellerView>("mine");
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // localStorage chỉ đọc được sau khi mount (SSR không có), nên nạp trong effect.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTER_KEY) ?? "null");
      if (saved) {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (typeof saved.sellerView === "string") setSellerView(saved.sellerView);
        if (Array.isArray(saved.status)) setStatusFilters(new Set(saved.status));
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {}
    setFiltersLoaded(true);
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return;
    try {
      localStorage.setItem(
        FILTER_KEY,
        JSON.stringify({ sellerView, status: Array.from(statusFilters) }),
      );
    } catch {}
  }, [filtersLoaded, sellerView, statusFilters]);

  const toggleStatusFilter = useCallback((f: StatusFilter) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }, []);

  const hide = useCallback((id: string) => setHidden((s) => new Set(s).add(id)), []);
  const unhide = useCallback(
    (id: string) =>
      setHidden((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      }),
    [],
  );

  const visible = useMemo(
    () => (hidden.size ? optimisticOrders.filter((o) => !hidden.has(o.id)) : optimisticOrders),
    [optimisticOrders, hidden],
  );
  const round = currentRound(visible);
  const selectedDot = round + (viewNext ? 1 : 0);
  const hasNext = useMemo(() => visible.some((o) => o.dot > round), [visible, round]);
  const roundOrders = useMemo(() => visible.filter((o) => o.dot === selectedDot), [visible, selectedDot]);

  const filteredOrders = useMemo(() => {
    const q = foldVi(search);
    return roundOrders.filter((o) => {
      if (q && !foldVi(o.ten_nguoi_mua).includes(q)) return false;
      if (statusFilters.has("chua_thanh_toan") && o.da_thanh_toan) return false;
      if (statusFilters.has("chua_giao") && o.da_giao) return false;
      if (sellerView === "mine" && o.seller_id !== currentUserId) return false;
      if (sellerView !== "mine" && sellerView !== "all" && o.seller_id !== sellerView) return false;
      return true;
    });
  }, [roundOrders, search, statusFilters, sellerView, currentUserId]);

  return (
    <OrdersContext.Provider
      value={{
        orders: visible,
        currentUserId,
        apply,
        currentRound: round,
        selectedDot,
        viewNext,
        setViewNext,
        hasNext,
        roundOrders,
        filteredOrders,
        search,
        setSearch,
        statusFilters,
        toggleStatusFilter,
        sellerView,
        setSellerView,
        hide,
        unhide,
        draft,
        setDraft,
        suggestions,
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
