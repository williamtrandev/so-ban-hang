"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NotebookText, PencilLine, Wallet, History, Users, Settings, LogOut, type LucideIcon } from "lucide-react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

type NavLink = { href: string; label: string; icon: LucideIcon; secondary?: boolean };

const LINKS: NavLink[] = [
  { href: "/nhap-don", label: "Nhập đơn", icon: PencilLine },
  { href: "/quyet-toan", label: "Quyết toán", icon: Wallet },
  { href: "/lich-su", label: "Lịch sử", icon: History, secondary: true },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings, secondary: true },
];

// secondary: label chỉ hiện trên desktop, mobile gọn còn icon để khỏi tràn header.
const ADMIN_LINKS: NavLink[] = [
  { href: "/nguoi-dung", label: "Người dùng", icon: Users, secondary: true },
];

export function NavBar({ fullName, role }: { fullName: string; role: string }) {
  const pathname = usePathname();
  const links = role === "admin" ? [...LINKS, ...ADMIN_LINKS] : LINKS;

  return (
    <header className="sticky top-3 z-40 px-3 md:top-4 md:px-4">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-2xl border border-foreground/10 bg-background/80 px-2 shadow-[0_12px_32px_-16px_color-mix(in_oklch,var(--foreground)_30%,transparent),inset_0_1px_0_color-mix(in_oklch,var(--foreground)_6%,transparent)] backdrop-blur-xl md:gap-4 md:px-4">
        <div className="flex min-w-0 items-center gap-1.5 md:gap-4">
          <Link href="/nhap-don" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
              <NotebookText className="size-4" strokeWidth={1.75} />
            </span>
            <span className="hidden font-heading text-sm font-semibold tracking-tight sm:inline">
              Sổ bán hàng
            </span>
          </Link>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <nav className="flex items-center gap-0.5 md:gap-1">
            {links.map((link) => {
              const active = pathname?.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors md:px-3 md:text-sm",
                    active ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative size-4 shrink-0" strokeWidth={1.75} />
                  <span className={cn("relative", link.secondary && "hidden md:inline")}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <ThemeToggle />
          <span className="hidden items-center gap-2 sm:flex">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
              {initialsOf(fullName)}
            </span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {fullName}
              {role === "admin" ? " · Admin" : ""}
            </span>
          </span>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              aria-label="Đăng xuất"
              className="gap-1.5 rounded-full max-sm:w-7 max-sm:px-0"
            >
              <LogOut className="size-4 sm:hidden" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
