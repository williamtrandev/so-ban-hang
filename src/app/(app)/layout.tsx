import { redirect } from "next/navigation";
import { getProfile, getSessionUser } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";
import { PageTransition } from "@/components/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/dang-nhap");

  const profile = await getProfile();

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
