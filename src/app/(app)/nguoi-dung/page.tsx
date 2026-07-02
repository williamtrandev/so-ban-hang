import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserList, type UserRow } from "./user-list";

const STATUS_ORDER: Record<UserRow["status"], number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
};

export default async function NguoiDungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Chỉ admin mới xem được trang quản lý người dùng.
  if (me?.role !== "admin") redirect("/nhap-don");

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, created_at")
    .order("created_at", { ascending: false });

  const users = ((data ?? []) as UserRow[])
    .slice()
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Người dùng</h1>
        <p className="text-sm text-muted-foreground">
          {pendingCount > 0
            ? `Có ${pendingCount} tài khoản đang chờ bạn duyệt.`
            : "Duyệt hoặc từ chối các tài khoản đăng nhập vào hệ thống."}
        </p>
      </header>

      <UserList users={users} currentUserId={user.id} />
    </div>
  );
}
