-- Tách nem thành 2 loại: nem ăn liền và nem mới. Cùng giá (nhóm nem_bi), chỉ
-- khác nhau ở phân loại + đếm số lượng.
-- Dữ liệu cũ (so_luong_nem) coi như nem ăn liền.
-- Chạy file này trong Supabase SQL Editor.

alter table public.orders rename column so_luong_nem to so_luong_nem_an_lien;

alter table public.orders
  add column so_luong_nem_moi integer not null default 0 check (so_luong_nem_moi >= 0);

-- Cập nhật ràng buộc "phải có ít nhất 1 số lượng" để tính cả nem mới.
alter table public.orders drop constraint if exists orders_has_quantity;
alter table public.orders
  add constraint orders_has_quantity
  check (
    so_luong_nem_an_lien > 0
    or so_luong_nem_moi > 0
    or so_luong_bi > 0
    or so_luong_cha > 0
  );
