import { CalendarCheck, Wallet, ShoppingBag, TrendingUp } from "lucide-react";
import { formatVnd } from "@/lib/domain/types";
import type { SettlementRow } from "@/lib/domain/data";

export function HistorySummary({ settlements }: { settlements: SettlementRow[] }) {
  const sum = (k: "tien_goc" | "tien_ban" | "tien_loi") =>
    settlements.reduce((acc, s) => acc + s[k], 0);

  const stats = [
    { icon: CalendarCheck, label: "Đợt đã chốt", value: String(settlements.length), accent: false },
    { icon: Wallet, label: "Tổng tiền gốc", value: formatVnd(sum("tien_goc")), accent: false },
    { icon: ShoppingBag, label: "Tổng tiền bán", value: formatVnd(sum("tien_ban")), accent: false },
    { icon: TrendingUp, label: "Tổng tiền lời", value: formatVnd(sum("tien_loi")), accent: true },
  ];

  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex min-w-0 flex-col gap-2 rounded-xl p-3.5 ring-1 animate-in fade-in slide-in-from-bottom-2 ${
            s.accent
              ? "bg-gradient-to-br from-primary/15 to-primary/5 ring-primary/20"
              : "bg-card ring-foreground/10"
          }`}
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
        >
          <dt
            className={`flex items-center gap-1.5 text-xs ${s.accent ? "font-medium text-primary" : "text-muted-foreground"}`}
          >
            <s.icon className="size-3.5" strokeWidth={1.75} />
            {s.label}
          </dt>
          <dd
            className={`truncate text-base font-semibold tabular-nums sm:text-lg ${s.accent ? "text-primary" : ""}`}
          >
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
