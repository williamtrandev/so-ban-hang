-- Nhập đơn cho đợt kế tiếp mà không cần chốt đợt hiện tại.
-- Mỗi đơn mang số đợt `dot`. Đợt hiện tại = dot nhỏ nhất trong các đơn CHƯA quyết
-- toán; đợt kế tiếp = dot + 1. Quyết toán chỉ chốt đơn thuộc đợt hiện tại, đơn đợt
-- kế tiếp giữ nguyên và tự thành đợt hiện tại sau đó.
-- Chạy file này trong Supabase SQL Editor.

alter table public.orders
  add column dot integer not null default 0;

-- Lọc nhanh đơn chưa quyết toán theo đợt.
create index orders_pending_dot_idx on public.orders (dot) where settlement_id is null;
