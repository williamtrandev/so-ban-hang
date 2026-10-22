import { Banknote, TrendingUp, History } from "lucide-react";
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
import { SettlementPanel } from "./settlement-panel";
import { SellerRevenueList } from "./seller-revenue-list";
import { ContentReveal } from "@/components/page-transition";

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

  // xl: trang khoá đúng chiều cao viewport (trừ navbar + padding main), list dài
  // scroll bên trong card thay vì scroll cả trang.
  return (
    <ContentReveal>
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-5 xl:h-[calc(100dvh-7.5rem)]">
      <header className="flex shrink-0 flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Quyết toán</h1>
        <p className="text-sm text-muted-foreground">
          Thống kê doanh thu và chốt đợt bán hiện tại.
        </p>
      </header>

      <dl className="grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {allTimeStats.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-xl p-3.5 ring-1 ${
              s.highlight
                ? "col-span-2 bg-gradient-to-br from-primary/15 to-primary/5 ring-primary/20 sm:col-span-1"
                : "bg-card ring-foreground/10"
            }`}
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
        <Card className="xl:col-span-7 xl:flex xl:min-h-0 xl:flex-col">
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

        <Card className="xl:col-span-5 xl:flex xl:min-h-0 xl:flex-col">
          <CardHeader>
            <CardTitle>Doanh thu theo người bán</CardTitle>
            <CardDescription>
              Tiền bán và tiền gốc toàn thời gian, gồm cả đợt đang bán.
            </CardDescription>
          </CardHeader>
          <CardContent className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            <SellerRevenueList rows={allTimeBySeller} />
          </CardContent>
        </Card>
      </div>
    </div>
    </ContentReveal>
  );
}
