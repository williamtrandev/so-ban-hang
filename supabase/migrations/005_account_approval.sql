-- Duyệt tài khoản: user mới đăng nhập phải được admin duyệt mới vào được hệ thống.
-- User đang có sẵn được tự động 'approved' để không bị khoá.
-- Chạy file này trong Supabase SQL Editor.

create type public.account_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column status public.account_status not null default 'pending';

-- Grandfather: mọi user đang tồn tại giữ nguyên quyền vào hệ thống.
update public.profiles set status = 'approved';

-- User mới tạo qua handle_new_user() không set status -> nhận default 'pending'.

-- Cho admin duyệt / từ chối (cập nhật status, role) của bất kỳ profile nào.
create policy "profiles: admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
