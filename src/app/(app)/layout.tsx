import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";

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
      <main className="flex-1 animate-in px-4 pt-10 pb-8 fade-in slide-in-from-bottom-2 duration-500 md:px-6 md:pt-12">
        {children}
      </main>
    </div>
  );
}
