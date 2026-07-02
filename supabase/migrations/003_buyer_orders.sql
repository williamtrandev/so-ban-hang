-- Đổi model: 1 order = 1 đơn của người mua (tên, SL nem/bì/chả, ghi chú, trạng thái
-- thanh toán/giao hàng) thay vì 1 order = 1 dòng sản phẩm.
-- Bảng orders hiện chỉ có data test, xoá dựng lại an toàn.
-- Chạy file này trong Supabase SQL Editor.

drop table if exists public.orders cascade;
drop type if exists public.product_type;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id),
  ten_nguoi_mua text not null,
  so_luong_nem integer not null default 0 check (so_luong_nem >= 0),
  so_luong_bi integer not null default 0 check (so_luong_bi >= 0),
  so_luong_cha integer not null default 0 check (so_luong_cha >= 0),
  ghi_chu text,
  da_thanh_toan boolean not null default false,
  da_giao boolean not null default false,
  gia_goc_nem_bi_snap numeric(12, 0) not null,
  gia_ban_nem_bi_snap numeric(12, 0) not null,
  gia_goc_cha_snap numeric(12, 0) not null,
  gia_ban_cha_snap numeric(12, 0) not null,
  settlement_id uuid references public.settlements (id),
  created_at timestamptz not null default now(),
  constraint orders_has_quantity check (so_luong_nem > 0 or so_luong_bi > 0 or so_luong_cha > 0)
);

create index orders_seller_pending_idx on public.orders (seller_id) where settlement_id is null;

alter table public.orders enable row level security;

create policy "orders: seller select own" on public.orders
  for select using (seller_id = auth.uid());

create policy "orders: admin select all" on public.orders
  for select using (public.is_admin());

create policy "orders: seller insert own" on public.orders
  for insert with check (seller_id = auth.uid());

create policy "orders: seller settle own pending" on public.orders
  for update using (seller_id = auth.uid() and settlement_id is null)
  with check (seller_id = auth.uid());

create policy "orders: seller delete own pending" on public.orders
  for delete using (seller_id = auth.uid() and settlement_id is null);
