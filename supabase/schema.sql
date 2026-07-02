-- Chạy file này trong Supabase SQL Editor (Project > SQL Editor > New query)

create type public.product_type as enum ('nem', 'bi', 'cha');
create type public.price_group as enum ('nem_bi', 'cha');
create type public.user_role as enum ('admin', 'seller');

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'seller',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: self select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: admin select all" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- auto-create profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'seller');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ prices (lịch sử giá, snapshot vào order lúc tạo) ============
create table public.prices (
  id uuid primary key default gen_random_uuid(),
  price_group public.price_group not null,
  gia_goc numeric(12, 0) not null check (gia_goc >= 0),
  gia_ban numeric(12, 0) not null check (gia_ban >= 0),
  effective_from timestamptz not null default now(),
  set_by uuid references public.profiles (id)
);

alter table public.prices enable row level security;

create policy "prices: any authenticated select" on public.prices
  for select using (auth.role() = 'authenticated');

create policy "prices: admin insert" on public.prices
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- giá khởi tạo theo yêu cầu: nem/bì gốc 25.000 bán 35.000, chả gốc 80.000 bán 100.000
insert into public.prices (price_group, gia_goc, gia_ban) values
  ('nem_bi', 25000, 35000),
  ('cha', 80000, 100000);

-- ============ settlements (đợt quyết toán) ============
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id),
  tien_goc numeric(14, 0) not null,
  tien_ban numeric(14, 0) not null,
  tien_loi numeric(14, 0) not null,
  closed_at timestamptz not null default now()
);

alter table public.settlements enable row level security;

create policy "settlements: seller select own" on public.settlements
  for select using (seller_id = auth.uid());

create policy "settlements: admin select all" on public.settlements
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "settlements: seller insert own" on public.settlements
  for insert with check (seller_id = auth.uid());

-- ============ orders (đơn bán từng lần nhập) ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id),
  product_type public.product_type not null,
  so_luong integer not null check (so_luong > 0),
  gia_goc_snap numeric(12, 0) not null,
  gia_ban_snap numeric(12, 0) not null,
  settlement_id uuid references public.settlements (id),
  created_at timestamptz not null default now()
);

create index orders_seller_pending_idx on public.orders (seller_id) where settlement_id is null;

alter table public.orders enable row level security;

create policy "orders: seller select own" on public.orders
  for select using (seller_id = auth.uid());

create policy "orders: admin select all" on public.orders
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "orders: seller insert own" on public.orders
  for insert with check (seller_id = auth.uid());

-- cho phép seller gán settlement_id vào đơn CHƯA quyết toán của chính mình (thao tác quyết toán)
create policy "orders: seller settle own pending" on public.orders
  for update using (seller_id = auth.uid() and settlement_id is null)
  with check (seller_id = auth.uid());

-- cho phép seller xoá đơn nhập nhầm, miễn là CHƯA quyết toán
create policy "orders: seller delete own pending" on public.orders
  for delete using (seller_id = auth.uid() and settlement_id is null);
