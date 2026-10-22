"use client";

import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, syncThemeColor, useResolvedTheme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useResolvedTheme();

  // Thẻ meta theme-color có thể render sau script đầu trang nên đồng bộ lại ở đây.
  useEffect(() => syncThemeColor(theme), [theme]);

  // Chưa từng chọn thì đi theo hệ thống, đổi theme OS là app đổi theo.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return;
      document.documentElement.classList.toggle("dark", mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => applyTheme(next)}
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:text-foreground"
    >
      {theme === "dark" ? <Moon /> : <Sun />}
    </Button>
  );
}
