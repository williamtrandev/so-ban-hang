-- Thêm 2 sản phẩm: chuối chiên và khoai lang chiên. Mỗi loại 1 nhóm giá riêng
-- (giống chả), snapshot giá vào đơn lúc tạo. Đơn cũ mặc định số lượng 0.
--
-- price_group đổi từ enum sang text + check: Postgres không cho dùng giá trị
-- enum mới trong cùng transaction vừa thêm nó (lỗi 55P04), mà SQL Editor chạy
-- cả file trong 1 transaction. Dùng text thì thêm nhóm giá sau này chỉ là sửa
-- check constraint. Chạy nguyên file này 1 lần trong Supabase SQL Editor.

-- ============ prices: enum -> text + check ============
alter table public.prices
  alter column price_group type text using price_group::text;

alter table public.prices drop constraint if exists prices_price_group_check;
alter table public.prices
  add constraint prices_price_group_check
  check (price_group in ('nem_bi', 'cha', 'chuoi_chien', 'khoai_lang_chien'));

drop type if exists public.price_group;

-- ============ orders: cột số lượng + snapshot giá ============
alter table public.orders
  add column if not exists so_luong_chuoi_chien integer not null default 0
    check (so_luong_chuoi_chien >= 0),
  add column if not exists so_luong_khoai_lang_chien integer not null default 0
    check (so_luong_khoai_lang_chien >= 0),
  add column if not exists gia_goc_chuoi_chien_snap numeric(12, 0) not null default 0,
  add column if not exists gia_ban_chuoi_chien_snap numeric(12, 0) not null default 0,
  add column if not exists gia_goc_khoai_lang_chien_snap numeric(12, 0) not null default 0,
  add column if not exists gia_ban_khoai_lang_chien_snap numeric(12, 0) not null default 0;

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
    or so_luong_chuoi_chien > 0
    or so_luong_khoai_lang_chien > 0
  );

-- ============ giá khởi tạo ============
-- Chuối chiên gốc 20.000 bán 25.000; khoai lang chiên gốc 30.000 bán 35.000.
-- Bỏ qua nếu nhóm đó đã có giá (chạy lại file không tạo bản ghi trùng).
insert into public.prices (price_group, gia_goc, gia_ban)
select v.price_group, v.gia_goc, v.gia_ban
from (
  values ('chuoi_chien', 20000, 25000),
         ('khoai_lang_chien', 30000, 35000)
) as v (price_group, gia_goc, gia_ban)
where not exists (
  select 1 from public.prices p where p.price_group = v.price_group
);
