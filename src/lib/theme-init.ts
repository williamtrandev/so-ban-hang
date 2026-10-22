// Màu thanh trạng thái (PWA/iOS) khớp --background của từng chế độ.
export const THEME_COLOR = { light: "#f4f8f5", dark: "#090d0b" } as const;

// Chạy inline trong <head> trước khi paint: áp .dark + màu thanh trạng thái theo
// lựa chọn đã lưu (chưa chọn thì theo hệ thống) để không nháy sai theme.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",d?"${THEME_COLOR.dark}":"${THEME_COLOR.light}")})}catch(e){}})()`;
