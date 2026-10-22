import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBuyerSuggestions, getCurrentPrices, getPendingOrders } from "@/lib/domain/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingOrdersTable } from "./pending-orders-table";
import { QuickInputTabs } from "./quick-input-tabs";
import { OrdersProvider } from "./orders-provider";
import { RoundSwitcher } from "./round-switcher";
import { OrderStats } from "./order-stats";

export default async function NhapDonPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [prices, orders, suggestions] = await Promise.all([
    getCurrentPrices(supabase),
    getPendingOrders(supabase),
    getBuyerSuggestions(supabase),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-24 md:gap-5 md:pb-8">
      <OrdersProvider orders={orders} currentUserId={user!.id} suggestions={suggestions}>
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Nhập đơn</h1>
          <RoundSwitcher />
        </header>

        <OrderStats />

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms] [animation-fill-mode:backwards]">
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

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
          <CardHeader>
            <CardTitle>Danh sách đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingOrdersTable prices={prices} />
          </CardContent>
        </Card>
      </OrdersProvider>
    </div>
  );
}
