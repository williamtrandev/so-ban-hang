import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ChoDuyetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, status")
    .eq("id", user.id)
    .single();

  // Đã được duyệt thì vào thẳng hệ thống.
  if (profile?.status === "approved") redirect("/nhap-don");

  const rejected = profile?.status === "rejected";

  return (
    <AuthShell>
      <Card className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="text-xl">
            {rejected ? "Tài khoản bị từ chối" : "Chờ admin duyệt"}
          </CardTitle>
          <CardDescription>
            {rejected
              ? "Tài khoản của bạn chưa được cấp quyền vào hệ thống. Liên hệ admin nếu cần hỗ trợ."
              : "Tài khoản của bạn đang chờ admin duyệt. Vui lòng quay lại sau khi được duyệt."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Đăng nhập bằng: <span className="font-medium text-foreground">{user.email}</span>
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full">
              Đăng xuất
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
