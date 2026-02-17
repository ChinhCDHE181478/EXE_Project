"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "../AuthProvider";

export default function Header() {
  const pathname = usePathname();
  const shouldHide = pathname?.startsWith("/admin");
  const [mounted, setMounted] = useState(false);
  const { user, logout: authLogout } = useAuth();

  // State theo dõi scroll
  const [isScrolled, setIsScrolled] = useState(false);

  const nav = [
    { href: "/pages/flights", label: "Chuyến bay" },
    { href: "/pages/hotels", label: "Khách sạn" },
    { href: "/chatbox", label: "Lên lịch trình" },
  ];

  const active = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lắng nghe scroll để đổi style
  useEffect(() => {
    const handleScroll = () => {
      // Cuộn quá 10px thì đổi màu
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  const logout = async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch { }

    setUserOpen(false);
    setOpen(false);
    window.dispatchEvent(new Event("logout"));
    window.location.href = "/";
  };

  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!userOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = userRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setUserOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [userOpen]);

  if (shouldHide) return null;

  // Logic xác định xem có nên trong suốt không
  // Chỉ trong suốt khi: Đang ở trang chủ ("/") VÀ chưa cuộn (isScrolled === false)
  const isTransparent = mounted && pathname === "/" && !isScrolled;

  return (
    <header
      className={`
        fixed top-0 z-[80] w-full transition-all duration-300
        ${isTransparent
          ? "bg-transparent shadow-none" // Trong suốt hoàn toàn
          : "bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 shadow-sm" // Trắng mờ như cũ
        }
      `}
    >
      <div className="container mx-auto px-4 h-17 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/brand/logo.png"
            alt="VivuPlan"
            // Giữ nguyên kích thước h-24 như yêu cầu
            className="h-24 w-auto object-contain transition-all duration-300"
            // Nếu logo của bạn màu đen, khi nền tối (transparent) nó sẽ bị chìm.
            // Đoạn style này sẽ đảo màu logo sang trắng (invert) khi header trong suốt.
            // Nếu logo của bạn đã nổi trên nền tối rồi thì bỏ dòng style đi.
            style={isTransparent ? { filter: "brightness(0) invert(1)" } : {}}
          />
        </Link>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[15px] transition-colors font-medium ${active(n.href)
                ? isTransparent
                  ? "text-cyan-300" // Active màu sáng khi nền tối
                  : "text-[#0891b2]" // Active màu xanh khi nền trắng
                : isTransparent
                  ? "text-white/90 hover:text-white" // Text trắng khi nền tối
                  : "text-slate-800 hover:text-[#0891b2]" // Text đen khi nền trắng
                }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Góc phải */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <div className="relative md:hidden" ref={panelRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Mở menu"
              className={`p-2 rounded-lg border transition-colors ${isTransparent
                ? "border-white/30 bg-black/20 text-white hover:bg-black/30"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                {open ? (
                  <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" />
                ) : (
                  <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                )}
              </svg>
            </button>

            {/* Mobile Dropdown (Luôn giữ nền trắng cho dễ đọc) */}
            {open && (
              <div className="absolute right-0 mt-2 w-[260px] rounded-xl border bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-[90]">
                <div className="p-2">
                  <div className="text-xs text-slate-500 px-2 py-2">
                    Danh mục
                  </div>

                  <div className="grid gap-1">
                    {nav.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${active(n.href)
                          ? "bg-[#0891b2]/10 text-[#0891b2]"
                          : "text-slate-800 hover:bg-slate-50"
                          }`}
                      >
                        {n.label}
                      </Link>
                    ))}
                  </div>

                  <div className="my-2 h-px bg-slate-200" />

                  {user ? (
                    <div className="mt-1 grid gap-1">
                      <div className="px-3 py-2 rounded-lg bg-slate-50">
                        <div className="text-xs text-slate-600 truncate">
                          {user.email}
                        </div>
                      </div>

                      <Link
                        href="/pages/profile"
                        className="px-3 py-2 rounded-lg text-sm text-slate-800 hover:bg-slate-50"
                        onClick={() => setOpen(false)}
                      >
                        Hồ sơ (Profile)
                      </Link>

                      <button
                        className="px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 text-left"
                        onClick={logout}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/pages/login"
                      className="mt-1 block text-center px-3 py-2 rounded-lg border text-slate-800 hover:text-[#0891b2] hover:border-[#0891b2] transition-colors"
                    >
                      Đăng nhập
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop: user dropdown hoặc nút đăng nhập */}
          <div className="hidden md:block relative" ref={userRef}>
            {user ? (
              <>
                <button
                  onClick={() => setUserOpen((v) => !v)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${isTransparent
                    ? "border-white/30 text-white hover:bg-white/10"
                    : "border-slate-200 text-slate-800 hover:text-[#0891b2] hover:border-[#0891b2]"
                    }`}
                  title={user.email}
                >
                  <span className="text-sm truncate max-w-[150px]">
                    {user.email}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-2 w-[240px] rounded-xl border bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-[90]">
                    <div className="p-2">
                      <div className="px-3 py-2 rounded-lg bg-slate-50">
                        <div className="text-xs text-slate-600 truncate">
                          {user.email}
                        </div>
                      </div>

                      <Link
                        href="/pages/profile"
                        className="mt-1 block px-3 py-2 rounded-lg text-sm text-slate-800 hover:bg-slate-50"
                        onClick={() => setUserOpen(false)}
                      >
                        Hồ sơ (Profile)
                      </Link>

                      <button
                        className="mt-1 w-full text-left px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
                        onClick={logout}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/pages/login"
                className={`inline-flex px-3 py-1.5 rounded-md border transition-colors ${isTransparent
                  ? "border-white/30 text-white hover:bg-white/10 hover:border-white"
                  : "border-slate-200 text-slate-800 hover:text-[#0891b2] hover:border-[#0891b2]"
                  }`}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
