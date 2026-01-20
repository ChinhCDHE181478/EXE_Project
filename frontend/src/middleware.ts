import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

// Public routes (không cần login)
const publicPaths = [
  "/pages/login",
];

// User routes (chỉ cần login)
const userPaths = [
  "/",
  "/profile",
];

// Admin routes (cần role ADMIN)
const adminPaths = [
  "/admin",
];

export function middleware(request: NextRequest) {
  // const { pathname } = request.nextUrl;

  // // 1. Bỏ qua next internal & static files
  // if (
  //   pathname.startsWith("/_next") ||
  //   pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|mp4|mp3|woff2?|ttf|otf|eot|json|avif)$/)
  // ) {
  //   return NextResponse.next();
  // }

  // const refreshToken = request.cookies.get("refresh_token")?.value;
  // const accessToken = request.cookies.get("access_token")?.value;

  // // 2. Chưa đăng nhập
  // if (!refreshToken) {
  //   if (publicPaths.includes(pathname)) {
  //     return NextResponse.next();
  //   }

  //   return NextResponse.redirect(
  //     new URL("/pages/login", request.url)
  //   );
  // }

  // // 3. Có token → decode
  // if (accessToken) {
  //   try {
  //     const decoded = jwtDecode<{ scope?: string }>(accessToken);
  //     const scope = decoded?.scope;

  //     // 4. Admin route
  //     if (adminPaths.some(path => pathname.startsWith(path))) {
  //       if (scope !== "ADMIN") {
  //         return NextResponse.redirect(
  //           new URL("/access-denied", request.url)
  //         );
  //       }
  //     }

  //     // 5. Đã login mà vào login page → đá về home
  //     if (publicPaths.includes(pathname)) {
  //       return NextResponse.redirect(
  //         new URL("/", request.url)
  //       );
  //     }

  //     return NextResponse.next();
  //   } catch (error) {
  //     console.error("JWT decode error:", error);
  //     return NextResponse.redirect(
  //       new URL("/pages/login", request.url)
  //     );
  //   }
  // }

  // return NextResponse.next();
}
