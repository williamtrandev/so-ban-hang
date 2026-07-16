import Link from "next/link";
import { Banknote, TrendingUp, History, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentPrices,
  getPendingOrders,
  getSettlementHistory,
  getAllOrders,
} from "@/lib/domain/data";
import {
  calcTotals,
  buildSellerBreakdown,
  currentRound,
  formatVnd,
} from "@/lib/domain/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettlementPanel } from "./settlement-panel";

export default async function QuyetToanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const [prices, pendingOrders, history, allOrders] = await Promise.all([
    getCurrentPrices(supabase),
    getPendingOrders(supabase),
    getSettlementHistory(supabase),
    getAllOrders(supabase),
  ]);

  // Chỉ quyết toán đợt hiện tại; đơn đợt kế tiếp chưa tới lượt chốt.
  const round = currentRound(pendingOrders);
  const currentPending = pendingOrders.filter((o) => o.dot === round);
  const nextBatchCount = pendingOrders.length - currentPending.length;
  const totals = calcTotals(currentPending);
  const sellerBreakdown = buildSellerBreakdown(currentPending);
  // Doanh thu từng người toàn thời gian (mọi đơn, đã chốt + đang bán).
  const allTimeBySeller = buildSellerBreakdown(allOrders);

  // Tổng doanh thu toàn thời gian: các đợt đã chốt + đợt đang bán.
  const daChot = history.reduce(
    (acc, s) => ({
      tienBan: acc.tienBan + s.tien_ban,
      tienLoi: acc.tienLoi + s.tien_loi,
    }),
    { tienBan: 0, tienLoi: 0 },
  );
  const allTimeStats = [
    {
      icon: Banknote,
      label: "Tổng doanh thu",
      value: formatVnd(daChot.tienBan + totals.tienBan),
      sub: `đã chốt ${formatVnd(daChot.tienBan)} · đợt này ${formatVnd(totals.tienBan)}`,
      highlight: true,
    },
    {
      icon: TrendingUp,
      label: "Tổng tiền lời",
      value: formatVnd(daChot.tienLoi + totals.tienLoi),
      sub: `đã chốt ${formatVnd(daChot.tienLoi)} · đợt này ${formatVnd(totals.tienLoi)}`,
      highlight: false,
    },
    {
      icon: History,
      label: "Đợt đã chốt",
      value: String(history.length),
      sub: null,
      highlight: false,
    },
  ];

  return (
    // xl: trang khoá đúng chiều cao viewport (trừ navbar + padding main), list dài
    // scroll bên trong card thay vì scroll cả trang.
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-5 xl:h-[calc(100dvh-7.5rem)]">
      <header className="flex shrink-0 items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Quyết toán
          </h1>
          <p className="text-sm text-muted-foreground">
            Thống kê doanh thu và chốt đợt bán hiện tại.
          </p>
        </div>
        <Link
          href="/lich-su"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
        >
          <History />
          Lịch sử
          <span className="hidden text-muted-foreground tabular-nums sm:inline">
            ({history.length})
          </span>
        </Link>
      </header>

      <dl className="grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {allTimeStats.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-xl p-3.5 ring-1 animate-in fade-in slide-in-from-bottom-2 ${
              s.highlight
                ? "col-span-2 bg-gradient-to-br from-primary/15 to-primary/5 ring-primary/20 sm:col-span-1"
                : "bg-card ring-foreground/10"
            }`}
            style={{
              animationDelay: `${i * 60}ms`,
              animationFillMode: "backwards",
            }}
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                s.highlight
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground max-sm:hidden"
              }`}
            >
              <s.icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-col">
              <dt
                className={`text-xs leading-tight ${
                  s.highlight
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </dt>
              <dd
                className={`truncate text-base font-semibold tabular-nums sm:text-lg ${s.highlight ? "text-primary" : ""}`}
              >
                {s.value}
              </dd>
              {s.sub && (
                <p className="truncate text-[11px] text-muted-foreground tabular-nums">
                  {s.sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-12 xl:items-stretch">
        <Card className="xl:col-span-7 xl:flex xl:min-h-0 xl:flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
          <CardHeader>
            <CardTitle>Quyết toán đợt hiện tại</CardTitle>
            {nextBatchCount > 0 && (
              <CardDescription>
                Còn {nextBatchCount} đơn ở đợt kế tiếp, sẽ không bị chốt lần này.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
            <SettlementPanel
              totals={totals}
              pendingCount={currentPending.length}
              isAdmin={profile?.role === "admin"}
              prices={prices}
              sellerBreakdown={sellerBreakdown}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-5 xl:flex xl:min-h-0 xl:flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms] [animation-fill-mode:backwards]">
          <CardHeader>
            <CardTitle>Doanh thu theo người bán</CardTitle>
            <CardDescription>
              Toàn thời gian, gồm cả đợt đang bán.
            </CardDescription>
          </CardHeader>
          <CardContent className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {allTimeBySeller.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có đơn nào.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {allTimeBySeller.map((row, i) => (
                  <li
                    key={row.name}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        i === 0
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i === 0 ? (
                        <Crown className="size-4" strokeWidth={1.75} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {row.name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {row.count} đơn · {row.soLuong} phần
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatVnd(row.tienBan)}
                      </span>
                      <span className="text-xs tabular-nums text-primary">
                        +{formatVnd(row.tienLoi)} lời
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
