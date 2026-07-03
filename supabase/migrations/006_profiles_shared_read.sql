-- Sổ chung: mọi user đăng nhập cần đọc được tên người tạo đơn của người khác.
-- Trước đây profiles chỉ cho self + admin đọc, nên cột "Người tạo" của đơn người
-- khác hiện "—" với user thường. Mở quyền đọc profiles cho mọi user đăng nhập.
-- Chạy file này trong Supabase SQL Editor.

create policy "profiles: authenticated select all" on public.profiles
  for select using (auth.role() = 'authenticated');
