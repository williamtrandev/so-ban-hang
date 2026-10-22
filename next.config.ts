import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
    // Quay lại tab vừa xem trong 30s thì hiện ngay từ cache, khỏi tải lại.
    // Thao tác ghi dữ liệu (revalidatePath) vẫn xoá cache ngay.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
