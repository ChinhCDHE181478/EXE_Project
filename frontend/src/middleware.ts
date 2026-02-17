import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

// Public routes (không cần login)
const publicPaths = [
  "/",
  "/pages/flights",
  "/pages/hotels",
  "/pages/flights-result",
  "/pages/hotel-result",
  "/pages/results",
  "/payment/cancel",
  "/payment/success",
];

const onlyPublicPaths = [
  "/pages/login",
];

// User routes (chỉ cần login)
const userPaths = [
  "/pages/profile",
  "/chatbox",
];

// Admin routes (cần role ADMIN)
const adminPaths = [
  "/admin",
  "/admin/payments",
  "/admin/reports",
  "/admin/users",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bỏ qua next internal & static files
  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|mp4|mp3|woff2?|ttf|otf|eot|json|avif)$/)
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;
  let accessToken = request.cookies.get("access_token")?.value;

  // 2. Kiểm tra nếu chưa đăng nhập (không có refresh token)
  if (!refreshToken) {
    if (userPaths.includes(pathname) || adminPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/pages/login", request.url));
    }
    return NextResponse.next();
  }

  // 3. Xử lý token (có refresh token)
  let userRole = "USER";
  let response = NextResponse.next();

  // Hàm helper để decode token an toàn
  const getRoleFromToken = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.scope || decoded.role || "USER";
    } catch {
      return null;
    }
  };

  // Kiểm tra access token hiện tại
  let isAccessTokenValid = false;
  if (accessToken) {
    try {
      const decoded: any = jwtDecode(accessToken);
      if (decoded.exp * 1000 > Date.now()) {
        isAccessTokenValid = true;
        userRole = decoded.scope || decoded.role || "USER";
      }
    } catch {
      // Token lỗi -> coi như hết hạn
    }
  }

  // Nếu access token hết hạn hoặc không có -> Refresh
  if (!isAccessTokenValid) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const res = await fetch(`${backendUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const result = data.result || data;

        if (result?.accessToken) {
          accessToken = result.accessToken;
          userRole = getRoleFromToken(result.accessToken) || "USER";

          // Cập nhật cookie mới vào response
          response.cookies.set("access_token", result.accessToken, {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 60 * 24, // 1 ngày
          });

          if (result.refreshToken) {
            response.cookies.set("refresh_token", result.refreshToken, {
              path: "/",
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 7, // 7 ngày
            });
          }
        }
      } else {
        // Refresh thất bại -> Redirect login nếu vào trang cần quyền
        if (userPaths.includes(pathname) || adminPaths.some(path => pathname.startsWith(path))) {
          const loginRedirect = NextResponse.redirect(new URL("/pages/login", request.url));
          // Xóa cookie cũ để tránh loop
          loginRedirect.cookies.delete("access_token");
          loginRedirect.cookies.delete("refresh_token");
          return loginRedirect;
        }
      }
    } catch (error) {
      console.error("Middleware refresh error:", error);
      if (userPaths.includes(pathname) || adminPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/pages/login", request.url));
      }
    }
  }

  // 4. Kiểm tra quyền Admin
  if (adminPaths.some(path => pathname.startsWith(path))) {
    if (userRole !== "ADMIN") {
      // Redirect về trang chủ nếu không phải admin
      // Cần return response đã có cookie mới (nếu có refresh)
      // Nhưng NextResponse.redirect tạo response mới, nên phải copy cookie sang
      const homeRedirect = NextResponse.redirect(new URL("/", request.url));

      // Copy cookies từ response (nếu đã refresh) sang redirect response
      response.cookies.getAll().forEach((cookie) => {
        homeRedirect.cookies.set(cookie.name, cookie.value, cookie);
      });

      return homeRedirect;
    }
  }

  // 5. Đã login mà vào trang login -> Redirect Home
  if (onlyPublicPaths.includes(pathname)) {
    const homeRedirect = NextResponse.redirect(new URL("/", request.url));
    // Copy cookies từ response (nếu đã refresh) sang redirect response
    response.cookies.getAll().forEach((cookie) => {
      homeRedirect.cookies.set(cookie.name, cookie.value, cookie);
    });
    return homeRedirect;
  }

  return response;
}
