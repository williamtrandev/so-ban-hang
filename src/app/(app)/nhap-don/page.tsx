import { ReceiptText, Banknote, Wallet, Truck, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPrices, getPendingOrders } from "@/lib/domain/data";
import { calcTotals, formatVnd } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PendingOrdersTable } from "./pending-orders-table";
import { AddOrderBar } from "./add-order-bar";
import { QuickInputTabs } from "./quick-input-tabs";

export default async function NhapDonPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [prices, orders] = await Promise.all([
    getCurrentPrices(supabase),
    getPendingOrders(supabase),
  ]);

  const totals = calcTotals(orders);
  const chuaThanhToan = orders.filter((o) => !o.da_thanh_toan).length;
  const chuaGiao = orders.filter((o) => !o.da_giao).length;

  const stats = [
    { icon: ReceiptText, label: "Số đơn", value: String(orders.length) },
    { icon: Banknote, label: "Dự kiến bán", value: formatVnd(totals.tienBan), highlight: true },
    { icon: Wallet, label: "Chưa thanh toán", value: String(chuaThanhToan) },
    { icon: Truck, label: "Chưa giao", value: String(chuaGiao) },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Nhập đơn</h1>
        <p className="text-sm text-muted-foreground">
          Toàn bộ đơn của mọi người trong đợt hiện tại. Quyết toán khi chốt đợt.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`group flex items-center gap-3 rounded-xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 ${
              s.highlight
                ? "bg-gradient-to-br from-primary/15 to-primary/5 ring-primary/20 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--primary)_45%,transparent)]"
                : "bg-card ring-foreground/10 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--foreground)_25%,transparent)]"
            }`}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 ${
                s.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-col">
              <dt
                className={`truncate text-xs ${
                  s.highlight ? "font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </dt>
              <dd
                className={`truncate text-lg font-semibold tabular-nums sm:text-xl ${
                  s.highlight ? "text-primary" : ""
                }`}
              >
                {s.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] [animation-fill-mode:backwards]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            Nhập nhanh
          </CardTitle>
          <CardDescription>
            Từng đơn: gõ + Enter. Dán nhiều dòng: mỗi dòng{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">Tên, nem, bì, chả</code> (bỏ trống
            = 0), hoặc copy thẳng từ Excel/Sheets (cột Tên · Nem · Bì · Chả).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickInputTabs prices={prices} />
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:200ms] [animation-fill-mode:backwards]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Đơn chưa quyết toán
            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-accent px-1.5 text-[11px] font-semibold text-accent-foreground tabular-nums">
              {orders.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PendingOrdersTable orders={orders} currentUserId={user!.id} prices={prices} />
        </CardContent>
      </Card>

      <AddOrderBar prices={prices} />
    </div>
  );
}
