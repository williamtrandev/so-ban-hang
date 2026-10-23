import { createClient } from "@/lib/supabase/server";
import { getAllOrders, getPendingOrders, getSettlementHistory } from "@/lib/domain/data";
import { buildSellerBreakdown, currentRound } from "@/lib/domain/types";
import { SellerTable } from "../quyet-toan/seller-table";
import { getSessionUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { HistorySummary } from "./history-summary";
import { RevenueChart } from "./revenue-chart";
import { SettlementHistory } from "./settlement-history";
import { ContentReveal } from "@/components/page-transition";

export default async function LichSuPage() {
  const supabase = await createClient();
  const [history, user, pending, allOrders] = await Promise.all([
    getSettlementHistory(supabase),
    getSessionUser(),
    getPendingOrders(supabase),
    getAllOrders(supabase),
  ]);
  const round = currentRound(pending);
  const currentSellers = buildSellerBreakdown(pending.filter((o) => o.dot === round));
  const allTimeSellers = buildSellerBreakdown(allOrders);

  return (
    <ContentReveal>
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Lịch sử và doanh thu</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu các đợt đã chốt. Bấm vào một đợt để xem chi tiết đơn hàng.
        </p>
      </header>

      {history.length > 0 && <HistorySummary settlements={history} />}

      {history.length >= 2 && (
        <Card>
          <CardContent>
            <RevenueChart settlements={history} />
          </CardContent>
        </Card>
      )}

      {allTimeSellers.length > 0 && (
        <Card>
          <CardContent>
            <SellerTable current={currentSellers} allTime={allTimeSellers} defaultTab="all" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="px-2 sm:px-3">
          <SettlementHistory settlements={history} currentUserId={user?.id ?? ""} />
        </CardContent>
      </Card>
    </div>
    </ContentReveal>
  );
}
