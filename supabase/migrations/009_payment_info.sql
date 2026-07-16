-- Thông tin nhận tiền theo từng người bán (không cố định 1 số).
-- Mỗi người bán tự cấu hình MoMo + tài khoản ngân hàng; QR của đơn dùng cấu hình
-- của người TẠO đơn. Chạy file này trong Supabase SQL Editor.

alter table public.profiles
  add column momo_phone text,
  add column bank_bin text,
  add column bank_account text,
  add column bank_account_name text;

-- Cập nhật riêng 4 cột nhận tiền của CHÍNH mình. Dùng security definer để không
-- phải mở policy update cả dòng profiles (tránh seller tự sửa role/status).
create or replace function public.set_payment_info(
  p_momo_phone text,
  p_bank_bin text,
  p_bank_account text,
  p_bank_account_name text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set momo_phone = nullif(btrim(p_momo_phone), ''),
      bank_bin = nullif(btrim(p_bank_bin), ''),
      bank_account = nullif(btrim(p_bank_account), ''),
      bank_account_name = nullif(btrim(p_bank_account_name), '')
  where id = auth.uid();
end;
$$;

revoke all on function public.set_payment_info(text, text, text, text) from public;
grant execute on function public.set_payment_info(text, text, text, text) to authenticated;
