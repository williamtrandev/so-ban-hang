"use client";

import { motion, useReducedMotion } from "motion/react";
import { formatVnd } from "@/lib/domain/types";

const PRODUCT_CHIPS = [
  { label: "Nem", giaBan: 35000, className: "top-[14%] left-[8%]", delay: 0 },
  { label: "Bì", giaBan: 35000, className: "top-[52%] left-[2%]", delay: 0.6 },
  { label: "Chả lụa", giaBan: 100000, className: "top-[32%] left-[52%]", delay: 1.1 },
] as const;

export function AuthShell({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <main className="grid min-h-[100dvh] flex-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary/[0.06] lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 20% 20%, color-mix(in oklch, var(--primary) 22%, transparent), transparent), radial-gradient(ellipse 50% 40% at 85% 75%, color-mix(in oklch, var(--primary) 16%, transparent), transparent)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <span className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              NB
            </span>
            Sổ bán hàng
          </span>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-md text-4xl leading-[1.1] font-semibold tracking-tight text-balance xl:text-5xl">
              Mỗi đợt bán, một lần quyết toán rõ ràng.
            </h1>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
              Nhập số lượng nem, bì, chả đã bán. Đến đợt quyết toán, tiền gốc, tiền bán và tiền
              lời tự tính, không cần cộng tay.
            </p>
          </div>

          <div className="relative h-40">
            {PRODUCT_CHIPS.map((chip) => (
              <motion.div
                key={chip.label}
                className={`absolute ${chip.className} flex items-center gap-3 rounded-xl bg-card/90 px-4 py-3 shadow-lg shadow-black/10 ring-1 ring-foreground/10 backdrop-blur-sm`}
                initial={reduce ? undefined : { opacity: 0, y: 16 }}
                animate={
                  reduce
                    ? { opacity: 1 }
                    : { opacity: 1, y: [16, 0, -6, 0] }
                }
                transition={
                  reduce
                    ? { duration: 0.4 }
                    : {
                        opacity: { duration: 0.5, delay: chip.delay },
                        y: {
                          duration: 4.5,
                          delay: chip.delay,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                }
              >
                <span className="text-sm font-medium">{chip.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatVnd(chip.giaBan)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12">{children}</section>
    </main>
  );
}
