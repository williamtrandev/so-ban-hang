-- Fix: "infinite recursion detected in policy for relation profiles" (Postgres 42P17).
-- Root cause: "profiles: admin select all" queried public.profiles from within a
-- policy ON public.profiles. Every SELECT on profiles re-triggered that same policy.
-- A SECURITY DEFINER function bypasses RLS on its internal lookup, breaking the loop.
-- Chạy file này trong Supabase SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles: admin select all" on public.profiles;
create policy "profiles: admin select all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "orders: admin select all" on public.orders;
create policy "orders: admin select all" on public.orders
  for select using (public.is_admin());

drop policy if exists "settlements: admin select all" on public.settlements;
create policy "settlements: admin select all" on public.settlements
  for select using (public.is_admin());

drop policy if exists "prices: admin insert" on public.prices;
create policy "prices: admin insert" on public.prices
  for insert with check (public.is_admin());
