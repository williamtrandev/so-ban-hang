-- Sổ chung: mọi user đăng nhập xem toàn bộ đơn (kèm tên người tạo).
-- Quyết toán gom TẤT CẢ đơn chưa chốt của mọi người, không chỉ của mình.
-- Chạy file này trong Supabase SQL Editor.

-- orders: mọi user đăng nhập xem toàn bộ
drop policy if exists "orders: seller select own" on public.orders;
drop policy if exists "orders: admin select all" on public.orders;
create policy "orders: authenticated select all" on public.orders
  for select using (auth.role() = 'authenticated');

-- cho phép quyết toán bất kỳ đơn nào chưa chốt (không chỉ đơn của mình)
drop policy if exists "orders: seller settle own pending" on public.orders;
create policy "orders: settle any pending" on public.orders
  for update using (auth.role() = 'authenticated' and settlement_id is null)
  with check (auth.role() = 'authenticated');

-- seller vẫn chỉ xoá được đơn của chính mình khi chưa chốt (giữ policy cũ)

-- settlements: đổi seller_id -> closed_by (người bấm quyết toán), mọi user xem được
alter table public.settlements rename column seller_id to closed_by;

drop policy if exists "settlements: seller select own" on public.settlements;
drop policy if exists "settlements: admin select all" on public.settlements;
drop policy if exists "settlements: seller insert own" on public.settlements;

create policy "settlements: authenticated select all" on public.settlements
  for select using (auth.role() = 'authenticated');

create policy "settlements: authenticated insert" on public.settlements
  for insert with check (closed_by = auth.uid());
