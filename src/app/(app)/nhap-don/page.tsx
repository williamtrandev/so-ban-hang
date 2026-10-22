import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { getCurrentPrices, getPendingOrders } from "@/lib/domain/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingOrdersTable } from "./pending-orders-table";
import { QuickInputTabs } from "./quick-input-tabs";
import { OrdersProvider } from "./orders-provider";
import { RoundSwitcher } from "./round-switcher";
import { OrderStats } from "./order-stats";
import { ContentReveal } from "@/components/page-transition";

export default async function NhapDonPage() {
  const supabase = await createClient();
  const [user, prices, orders] = await Promise.all([
    getSessionUser(),
    getCurrentPrices(supabase),
    getPendingOrders(supabase),
  ]);

  return (
    <ContentReveal>
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-24 md:gap-5 md:pb-8">
      <OrdersProvider orders={orders} currentUserId={user!.id}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Nhập đơn</h1>
          <RoundSwitcher />
        </header>

        <OrderStats />

        <Card className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              Nhập nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickInputTabs prices={prices} />
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle>Danh sách đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingOrdersTable prices={prices} />
          </CardContent>
        </Card>
      </OrdersProvider>
    </div>
    </ContentReveal>
  );
}
