"use client";

import { useActionState, useRef, useEffect, useState, useMemo } from "react";
import { Zap, Minus, Check, X, History } from "lucide-react";
import { createBulkOrders } from "./actions";
import {
  parseBulkOrders,
  quickTokenState,
  bumpQuickQty,
  toggleQuickStatus,
  quickTextFromOrder,
  type QtyCode,
} from "./parse";
import { useOrders, toOptimisticOrder } from "./orders-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SoLuongChips } from "@/components/soluong-chips";
import { formatVnd, tienBanTheoGia, type Price, type PriceGroup } from "@/lib/domain/types";
import { cn, foldVi } from "@/lib/utils";

const PRODUCTS: { label: string; variants: { code: QtyCode; label: string }[] }[] = [
  { label: "Nem ăn liền", variants: [{ code: "nl", label: "Lá" }, { code: "nh", label: "Hộp" }] },
  { label: "Nem mới", variants: [{ code: "nml", label: "Lá" }, { code: "nmh", label: "Hộp" }] },
  { label: "Bì", variants: [{ code: "bl", label: "Lá" }, { code: "bh", label: "Hộp" }] },
  { label: "Chả", variants: [{ code: "c", label: "+1" }] },
  { label: "Chuối chiên", variants: [{ code: "cc", label: "+1" }] },
  { label: "Khoai lang chiên", variants: [{ code: "kl", label: "+1" }] },
];

export function QuickAddForm({ prices }: { prices: Record<PriceGroup, Price> }) {
  const { apply, currentUserId, selectedDot, viewNext, draft, setDraft, suggestions } = useOrders();
  const [error, formAction, pending] = useActionState(
    async (prev: string | null, formData: FormData) => {
      // Dispatch optimistic TRONG transition đang await server -> đơn giữ hiện tới khi xong.
      const r = parseBulkOrders(String(formData.get("bulk_text") ?? ""))[0];
      if (r?.ok) {
        apply({
          type: "add",
          orders: [toOptimisticOrder(r.order, currentUserId, prices, selectedDot)],
        });
      }
      return createBulkOrders(prev, formData);
    },
    null,
  );
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);
  const pointerTypeRef = useRef<string>("mouse");
  const result = useMemo(() => parseBulkOrders(text)[0], [text]);
  const tokens = useMemo(() => quickTokenState(text), [text]);
  const tongTien = useMemo(
    () => (result?.ok ? tienBanTheoGia(result.order, prices) : 0),
    [result, prices],
  );

  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);

  // Đang gõ tên (chưa có dấu phẩy) thì gợi ý khách quen khớp tên, không dấu.
  const matches = useMemo(() => {
    if (text.includes(",")) return [];
    const q = foldVi(text);
    if (!q) return [];
    return suggestions
      .map((s) => ({ s, f: foldVi(s.name) }))
      .filter(({ f }) => f.includes(q))
      .sort((a, b) => Number(b.f.startsWith(q)) - Number(a.f.startsWith(q)) || b.s.count - a.s.count)
      .slice(0, 5)
      .map(({ s }) => s);
  }, [text, suggestions]);
  const showSuggest = focused && !dismissed && matches.length > 0;

  function pick(i: number) {
    const s = matches[i];
    if (!s) return;
    setText(quickTextFromOrder(s.name, s.last));
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggest) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + d + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      // Chưa có món thì Enter không gửi được, nên chọn luôn gợi ý.
      if (active >= 0 || !result?.ok) {
        e.preventDefault();
        pick(Math.max(active, 0));
      }
    } else if (e.key === "Escape") {
      setDismissed(true);
    }
  }

  // "Lặp lại đơn" từ danh sách đổ dòng có sẵn vào đây.
  useEffect(() => {
    if (draft === null) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setText(draft);
    setDraft(null);
    const el = inputRef.current;
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [draft, setDraft]);

  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
      return;
    }
    if (submittedRef.current && !error) {
      submittedRef.current = false;
      setText("");
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [pending, error]);

  // Chuột: giữ focus ở ô nhập để gõ tiếp. Cảm ứng: để bàn phím đóng lại cho
  // thấy hết bảng nút.
  const paletteProps = {
    type: "button" as const,
    onPointerDown: (e: React.PointerEvent) => {
      pointerTypeRef.current = e.pointerType;
    },
    onMouseDown: (e: React.MouseEvent) => {
      if (pointerTypeRef.current === "mouse") e.preventDefault();
    },
  };

  function edit(next: string) {
    setText(next);
    // Chưa có tên thì đưa con trỏ về đầu dòng để gõ tên ngay.
    if (!next.split(",")[0].trim() && pointerTypeRef.current === "mouse") {
      requestAnimationFrame(() => inputRef.current?.setSelectionRange(0, 0));
    }
  }

  const canSubmit = !!result?.ok && !pending;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next_batch" value={viewNext ? "on" : "off"} />
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            name="bulk_text"
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setDismissed(false);
              setActive(-1);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            role="combobox"
            aria-expanded={showSuggest}
            aria-controls="buyer-suggestions"
            autoComplete="off"
            autoFocus
            enterKeyHint="send"
            placeholder="Tên người mua"
            className="h-11 pr-9 text-base md:text-sm"
          />
          {text && (
            <button
              type="button"
              aria-label="Xoá"
              onClick={() => {
                setText("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          {showSuggest && (
            <ul
              id="buyer-suggestions"
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-border/70 bg-popover p-1 shadow-[0_16px_40px_-16px_color-mix(in_oklch,var(--foreground)_40%,transparent)] animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <li className="flex items-center gap-1.5 px-2.5 pt-1 pb-1.5 text-[11px] text-muted-foreground">
                <History className="size-3" />
                Khách quen · chọn để điền món lần trước
              </li>
              {matches.map((m, i) => (
                <li key={m.name} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(i)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      i === active ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{m.name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                        {m.count} đơn
                      </span>
                    </span>
                    <SoLuongChips q={m.last} className="[&>span]:py-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" disabled={!canSubmit} className="h-11 px-4">
          <Zap className="size-4" />
          {pending ? "Đang lưu..." : "Thêm"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {PRODUCTS.map((p) => (
          <div
            key={p.label}
            className="flex flex-col gap-1.5 rounded-xl border border-border/70 bg-muted/20 p-2"
          >
            <span className="truncate px-0.5 text-xs font-medium text-muted-foreground">{p.label}</span>
            <div className="flex gap-1.5">
              {p.variants.map((v) => {
                const n = tokens.qty[v.code] ?? 0;
                return (
                  <div key={v.code} className="flex min-w-0 flex-1">
                    <button
                      {...paletteProps}
                      onClick={() => edit(bumpQuickQty(text, v.code, 1))}
                      title={`Mã: ${v.code}`}
                      className={cn(
                        "flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg text-sm font-medium tabular-nums transition-colors select-none active:scale-[0.97]",
                        n > 0
                          ? "rounded-r-none bg-primary text-primary-foreground"
                          : "bg-background ring-1 ring-border hover:ring-primary/40",
                      )}
                    >
                      {n > 0 ? (
                        <>
                          {v.label !== "+1" && <span className="opacity-80">{v.label}</span>}
                          <span>{n}</span>
                        </>
                      ) : (
                        v.label
                      )}
                    </button>
                    {n > 0 && (
                      <button
                        {...paletteProps}
                        onClick={() => edit(bumpQuickQty(text, v.code, -1))}
                        aria-label={`Bớt 1 ${p.label} ${v.label}`}
                        className="flex h-9 w-7 shrink-0 items-center justify-center rounded-r-lg border-l border-primary-foreground/20 bg-primary/85 text-primary-foreground select-none active:scale-[0.97]"
                      >
                        <Minus className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["paid", "Đã thanh toán", tokens.paid],
            ["delivered", "Đã giao", tokens.delivered],
          ] as const
        ).map(([kind, label, on]) => (
          <button
            key={kind}
            {...paletteProps}
            onClick={() => edit(toggleQuickStatus(text, kind))}
            aria-pressed={on}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors select-none active:scale-[0.97]",
              on
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground ring-1 ring-border hover:text-foreground",
            )}
          >
            {on && <Check className="size-3.5" />}
            {label}
          </button>
        ))}
        {tongTien > 0 && (
          <span className="ml-auto text-base font-semibold tabular-nums text-primary">
            {formatVnd(tongTien)}
          </span>
        )}
      </div>

      <div className="flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
        {result?.ok ? (
          <>
            <span className="font-medium">{result.order.ten_nguoi_mua}</span>
            <SoLuongChips q={result.order} />
            {result.order.ghi_chu && (
              <span className="text-xs text-muted-foreground italic">
                &ldquo;{result.order.ghi_chu}&rdquo;
              </span>
            )}
          </>
        ) : result && !result.ok && text.includes(",") ? (
          <span className="text-destructive">{result.error}</span>
        ) : result ? (
          <span className="text-xs text-muted-foreground">Bấm món để thêm số lượng.</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Gõ nhanh cũng được:{" "}
            <code className="rounded bg-muted px-1 py-0.5">Cô Bảy, 2nl, 1bh, 1c, tt, ghi chú</code>{" "}
            <span className="hidden md:inline">· rê chuột lên nút để xem mã.</span>
          </span>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
