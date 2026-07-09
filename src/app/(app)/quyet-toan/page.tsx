import { Banknote, TrendingUp, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPrices, getPendingOrders, getSettlementHistory } from "@/lib/domain/data";
import { calcTotals, buildSellerBreakdown, formatVnd } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettlementPanel } from "./settlement-panel";
import { SettlementHistory } from "./settlement-history";

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

  const [prices, pendingOrders, history] = await Promise.all([
    getCurrentPrices(supabase),
    getPendingOrders(supabase),
    getSettlementHistory(supabase),
  ]);

  const totals = calcTotals(pendingOrders);
  const sellerBreakdown = buildSellerBreakdown(pendingOrders);

  // Tổng doanh thu toàn thời gian: các đợt đã chốt + đợt đang bán.
  const daChot = history.reduce(
    (acc, s) => ({ tienBan: acc.tienBan + s.tien_ban, tienLoi: acc.tienLoi + s.tien_loi }),
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Quyết toán</h1>
        <p className="text-sm text-muted-foreground">
          Chốt đợt hiện tại và xem lại các đợt đã quyết toán trước đó.
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {allTimeStats.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-xl p-4 ring-1 animate-in fade-in slide-in-from-bottom-2 ${
              s.highlight
                ? "bg-gradient-to-br from-primary/15 to-primary/5 ring-primary/20"
                : "bg-card ring-foreground/10"
            }`}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                s.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-col">
              <dt
                className={`text-xs leading-tight ${
                  s.highlight ? "font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </dt>
              <dd
                className={`truncate text-lg font-semibold tabular-nums ${s.highlight ? "text-primary" : ""}`}
              >
                {s.value}
              </dd>
              {s.sub && (
                <p className="truncate text-[11px] text-muted-foreground tabular-nums">{s.sub}</p>
              )}
            </div>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader>
            <CardTitle>Quyết toán đợt hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <SettlementPanel
              totals={totals}
              pendingCount={pendingOrders.length}
              isAdmin={profile?.role === "admin"}
              prices={prices}
              sellerBreakdown={sellerBreakdown}
            />
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms] [animation-fill-mode:backwards]">
          <CardHeader>
            <CardTitle>Lịch sử quyết toán</CardTitle>
          </CardHeader>
          <CardContent>
            <SettlementHistory settlements={history} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
