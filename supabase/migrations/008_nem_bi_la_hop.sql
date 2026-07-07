-- Nem và bì thêm chiều đóng gói: lá / hộp. Cùng giá nhóm nem_bi.
-- Nem = (ăn liền|mới) × (lá|hộp) = 4 loại. Bì = lá|hộp = 2 loại.
-- Dữ liệu cũ coi như loại "lá".
-- Chạy file này trong Supabase SQL Editor.

alter table public.orders rename column so_luong_nem_an_lien to so_luong_nem_an_lien_la;
alter table public.orders rename column so_luong_nem_moi to so_luong_nem_moi_la;
alter table public.orders rename column so_luong_bi to so_luong_bi_la;

alter table public.orders
  add column so_luong_nem_an_lien_hop integer not null default 0 check (so_luong_nem_an_lien_hop >= 0),
  add column so_luong_nem_moi_hop integer not null default 0 check (so_luong_nem_moi_hop >= 0),
  add column so_luong_bi_hop integer not null default 0 check (so_luong_bi_hop >= 0);

-- Cập nhật ràng buộc "phải có ít nhất 1 số lượng".
alter table public.orders drop constraint if exists orders_has_quantity;
alter table public.orders
  add constraint orders_has_quantity
  check (
    so_luong_nem_an_lien_la > 0
    or so_luong_nem_an_lien_hop > 0
    or so_luong_nem_moi_la > 0
    or so_luong_nem_moi_hop > 0
    or so_luong_bi_la > 0
    or so_luong_bi_hop > 0
    or so_luong_cha > 0
  );
