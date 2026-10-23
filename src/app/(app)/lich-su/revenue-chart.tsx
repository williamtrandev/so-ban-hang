"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, ChartColumnBig } from "lucide-react";
import { formatVnd } from "@/lib/domain/types";
import type { SettlementRow } from "@/lib/domain/data";
import { cn } from "@/lib/utils";

const RECENT = 12;
const H = 220;
const PAD = { top: 22, right: 18, bottom: 26, left: 40 };
const dateFmt = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
});

type Point = { dot: number; date: string; goc: number; ban: number; loi: number };

// 1.180.000 -> "1,18tr" · 450.000 -> "450k" (trục và nhãn ngắn gọn).
function compact(n: number): string {
  const fmt = (v: number) => v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1_000_000) return `${fmt(n / 1_000_000)}tr`;
  if (Math.abs(n) >= 1_000) return `${fmt(n / 1_000)}k`;
  return fmt(n);
}

// Mốc trục tròn: bước 1/2/2,5/5 × 10^k, khoảng 4 vạch.
function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}

function Delta({ cur, prev }: { cur: number; prev: number | undefined }) {
  if (prev === undefined || prev === 0) return null;
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        flat ? "text-muted-foreground" : up ? "text-primary" : "text-destructive",
      )}
    >
      <Icon className="size-3.5" />
      {flat ? "Không đổi" : `${up ? "+" : ""}${pct.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}%`}
      <span className="font-normal text-muted-foreground">so với đợt trước</span>
    </span>
  );
}

// Đầu cột bo 4px, chân cột vuông (nằm trên đường gốc / đoạn bên dưới).
function topRoundedRect(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export function RevenueChart({ settlements }: { settlements: SettlementRow[] }) {
  const [range, setRange] = useState<"recent" | "all">("recent");
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Danh sách vào là mới nhất trước; biểu đồ đọc trái -> phải theo thời gian.
  const all: Point[] = useMemo(
    () =>
      settlements
        .slice()
        .reverse()
        .map((s, i) => ({
          dot: i + 1,
          date: dateFmt.format(new Date(s.closed_at)),
          goc: s.tien_goc,
          ban: s.tien_ban,
          loi: s.tien_loi,
        })),
    [settlements],
  );
  const data = range === "recent" ? all.slice(-RECENT) : all;
  const last = data.at(-1)!;
  const prev = data.at(-2);
  const avgBan = data.reduce((a, p) => a + p.ban, 0) / data.length;
  const avgLoi = data.reduce((a, p) => a + p.loi, 0) / data.length;
  const margin = last.ban > 0 ? (last.loi / last.ban) * 100 : 0;

  const ticks = niceTicks(Math.max(...data.map((p) => p.ban)));
  const yMax = ticks.at(-1) || 1;
  const plotW = Math.max(width - PAD.left - PAD.right, 50);
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(Math.min(24, slot * 0.6), 4);
  const y = (v: number) => PAD.top + plotH - (Math.max(v, 0) / yMax) * plotH;
  const labelEvery = Math.ceil(data.length / Math.max(Math.floor(plotW / 36), 1));

  const hp = hover !== null ? data[hover] : null;
  const tipLeft = hover !== null ? PAD.left + slot * hover + slot / 2 : 0;

  const tiles = [
    { label: "Doanh thu đợt gần nhất", value: formatVnd(last.ban), delta: <Delta cur={last.ban} prev={prev?.ban} /> },
    {
      label: "Lời đợt gần nhất",
      value: formatVnd(last.loi),
      delta: <Delta cur={last.loi} prev={prev?.loi} />,
      accent: true,
    },
    {
      label: "Trung bình mỗi đợt",
      value: formatVnd(Math.round(avgBan)),
      delta: (
        <span className="text-xs text-muted-foreground">
          lời {formatVnd(Math.round(avgLoi))} · tỉ suất lời đợt gần nhất {margin.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}%
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-medium whitespace-nowrap">
          <ChartColumnBig className="size-4 text-muted-foreground" strokeWidth={1.75} />
          Doanh thu theo đợt
        </h2>
        {all.length > RECENT && (
          <div className="flex gap-0.5 rounded-lg bg-muted p-0.5 dark:bg-background/60">
            {(
              [
                ["recent", `${RECENT} đợt`, `${RECENT} đợt gần nhất`],
                ["all", "Tất cả", "Tất cả"],
              ] as const
            ).map(([key, short, long]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                aria-pressed={range === key}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  range === key
                    ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10 dark:bg-muted"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{long}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-xl p-3",
              t.accent ? "bg-primary/10 ring-1 ring-primary/20" : "bg-muted/50",
            )}
          >
            <dt className={cn("text-xs", t.accent ? "font-medium text-primary" : "text-muted-foreground")}>
              {t.label}
            </dt>
            <dd className={cn("text-lg font-semibold", t.accent && "text-primary")}>{t.value}</dd>
            <div className="min-w-0 truncate">{t.delta}</div>
          </div>
        ))}
      </dl>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-chart-profit" />
          Tiền lời
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-chart-cost" />
          Tiền gốc
        </span>
        <span className="ml-auto hidden sm:inline">Cả cột = doanh thu</span>
      </div>

      <div ref={boxRef} className="relative w-full min-w-0 overflow-visible select-none" onPointerLeave={() => setHover(null)}>
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          role="img"
          aria-label={`Biểu đồ cột doanh thu ${data.length} đợt, đợt gần nhất ${formatVnd(last.ban)}`}
          className="block overflow-visible"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                className={t === 0 ? "stroke-border" : "stroke-border/60"}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={PAD.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {compact(t)}
              </text>
            </g>
          ))}

          {data.map((p, i) => {
            const x = PAD.left + slot * i + (slot - barW) / 2;
            const gocTop = y(Math.min(p.goc, p.ban));
            const banTop = y(p.ban);
            const dim = hover !== null && hover !== i;
            const isLast = i === data.length - 1;
            return (
              <g key={p.dot} className="transition-opacity" opacity={dim ? 0.45 : 1}>
                <rect
                  x={x}
                  y={gocTop}
                  width={barW}
                  height={Math.max(y(0) - gocTop, 0)}
                  className="fill-chart-cost"
                />
                {p.loi > 0 && banTop < gocTop - 2 && (
                  <path d={topRoundedRect(x, banTop, barW, gocTop - 2 - banTop)} className="fill-chart-profit" />
                )}
                {(i % labelEvery === 0 || isLast) && (
                  <text
                    x={x + barW / 2}
                    y={H - 8}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px] tabular-nums",
                      isLast ? "fill-foreground font-medium" : "fill-muted-foreground",
                    )}
                  >
                    #{p.dot}
                  </text>
                )}
                {isLast && hover === null && (
                  <text
                    x={x + barW / 2}
                    y={banTop - 7}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-semibold tabular-nums"
                  >
                    {compact(p.ban)}
                  </text>
                )}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`Đợt ${p.dot}: doanh thu ${formatVnd(p.ban)}, lời ${formatVnd(p.loi)}`}
                  className="cursor-pointer outline-none"
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>

        {hp && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 rounded-xl border border-border/70 bg-popover p-3 text-xs shadow-lg"
            style={{
              // Đặt cạnh cột để không che chính cột đang xem; sát mép phải thì lật sang trái.
              left:
                tipLeft + barW / 2 + 12 + 176 <= width
                  ? tipLeft + barW / 2 + 12
                  : Math.max(tipLeft - barW / 2 - 12 - 176, 0),
            }}
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-medium text-foreground">Đợt #{hp.dot}</span>
              <span className="text-muted-foreground tabular-nums">{hp.date}</span>
            </div>
            <div className="text-base font-semibold text-foreground tabular-nums">{formatVnd(hp.ban)}</div>
            <div className="mb-2 text-muted-foreground">doanh thu</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-3 rounded-full bg-chart-profit" />
                <span className="font-semibold text-foreground tabular-nums">{formatVnd(hp.loi)}</span>
                <span className="ml-auto text-muted-foreground">lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-3 rounded-full bg-chart-cost" />
                <span className="font-medium text-foreground tabular-nums">{formatVnd(hp.goc)}</span>
                <span className="ml-auto text-muted-foreground">gốc</span>
              </div>
              <div className="mt-1 border-t border-border/60 pt-1 text-muted-foreground">
                Tỉ suất lời{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {hp.ban > 0 ? Math.round((hp.loi / hp.ban) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
