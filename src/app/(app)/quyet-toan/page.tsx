import { redirect } from "next/navigation";

// Quyết toán giờ nằm ngay ở Nhập đơn (nút "Quyết toán"); giữ route cho link/bookmark cũ.
export default function QuyetToanPage() {
  redirect("/nhap-don");
}
