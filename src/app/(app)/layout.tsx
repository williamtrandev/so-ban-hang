import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";
import { PageTransition } from "@/components/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .single();

  // Chưa được admin duyệt thì chưa cho vào hệ thống.
  if (profile?.status !== "approved") redirect("/cho-duyet");

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col">
      <NavBar fullName={profile?.full_name ?? user.email ?? ""} role={profile?.role ?? "seller"} />
      <main className="flex-1 px-4 pt-6 pb-8 md:px-6 md:pt-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
