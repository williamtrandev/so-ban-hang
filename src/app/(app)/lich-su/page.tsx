import { createClient } from "@/lib/supabase/server";
import { getSettlementHistory } from "@/lib/domain/data";
import { formatVnd } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettlementHistory } from "./settlement-history";

export default async function LichSuPage() {
  const supabase = await createClient();
  const history = await getSettlementHistory(supabase);

  const tongBan = history.reduce((sum, s) => sum + s.tien_ban, 0);
  const tongLoi = history.reduce((sum, s) => sum + s.tien_loi, 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Lịch sử quyết toán</h1>
        <p className="text-sm text-muted-foreground">
          {history.length > 0
            ? `${history.length} đợt đã chốt · bán ${formatVnd(tongBan)} · lời ${formatVnd(tongLoi)}`
            : "Các đợt đã chốt sẽ hiện ở đây."}
        </p>
      </header>

      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CardHeader>
          <CardTitle>Các đợt đã chốt</CardTitle>
        </CardHeader>
        <CardContent>
          <SettlementHistory settlements={history} />
        </CardContent>
      </Card>
    </div>
  );
}
