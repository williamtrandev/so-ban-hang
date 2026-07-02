"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, animate, useReducedMotion } from "motion/react";

export function AnimatedNumber({ value, formatter }: { value: number; formatter: (n: number) => string }) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      if (ref.current) ref.current.textContent = formatter(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = formatter(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, reduce, motionValue, formatter]);

  return <span ref={ref}>{formatter(0)}</span>;
}
