import { createClient } from "@/lib/supabase/server";
import { getSettlementHistory } from "@/lib/domain/data";
import { Card, CardContent } from "@/components/ui/card";
import { HistorySummary } from "./history-summary";
import { SettlementHistory } from "./settlement-history";

export default async function LichSuPage() {
  const supabase = await createClient();
  const history = await getSettlementHistory(supabase);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Lịch sử quyết toán</h1>
        <p className="text-sm text-muted-foreground">
          {history.length > 0
            ? "Bấm vào một đợt để xem đơn hàng và số liệu từng người bán."
            : "Các đợt đã chốt sẽ hiện ở đây."}
        </p>
      </header>

      {history.length > 0 && <HistorySummary settlements={history} />}

      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
        <CardContent className="px-2 sm:px-3">
          <SettlementHistory settlements={history} />
        </CardContent>
      </Card>
    </div>
  );
}
