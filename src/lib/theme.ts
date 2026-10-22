"use client";

import { useSyncExternalStore } from "react";
import { THEME_COLOR } from "./theme-init";

export type ResolvedTheme = "light" | "dark";

export function syncThemeColor(theme: ResolvedTheme) {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", THEME_COLOR[theme]));
}

export function applyTheme(theme: ResolvedTheme) {
  localStorage.setItem("theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// Theo dõi class .dark trên <html>: nguồn sự thật duy nhất, ai đổi cũng bắt được.
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light",
  );
}
