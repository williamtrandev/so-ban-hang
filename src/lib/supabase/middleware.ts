import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/dang-nhap"];
const BYPASS_PATHS = ["/auth/callback"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const isBypassPath = BYPASS_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));
  if (isBypassPath) return supabaseResponse;

  // getSession đọc cookie tại chỗ: token còn hạn thì KHÔNG gọi mạng (giữ TTFB
  // thấp để splash paint ngay khi mở PWA), hết hạn mới refresh qua Supabase.
  // Middleware chỉ định tuyến; xác thực thật nằm ở (app)/layout (getUser + profile).
  let session = null;
  try {
    const {
      data: { session: fetchedSession },
    } = await supabase.auth.getSession();
    session = fetchedSession;
  } catch {
    // Supabase unreachable: fail closed, treat as logged out
  }

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!session && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    return NextResponse.redirect(url);
  }

  if (session && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/nhap-don";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
