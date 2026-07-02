import { createClient } from "@/lib/supabase/server";
import { getCurrentPrices, getPendingOrders, getSettlementHistory } from "@/lib/domain/data";
import { calcTotals, buildSellerBreakdown } from "@/lib/domain/types";
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Quyết toán</h1>
        <p className="text-sm text-muted-foreground">
          Chốt đợt hiện tại và xem lại các đợt đã quyết toán trước đó.
        </p>
      </header>

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
