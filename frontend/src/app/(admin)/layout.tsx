"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "../AuthProvider";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BarChart3,
  Home,
  LogOut,
  Menu,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

// Replaced custom SVGs with lucide-react icons in the nav config below

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  const nav = useMemo(
    () => [
      { href: "/admin", label: "Tổng quan", icon: <LayoutDashboard size={20} /> },
      { href: "/admin/payments", label: "Thanh toán", icon: <CreditCard size={20} /> },
      { href: "/admin/users", label: "Người dùng", icon: <Users size={20} /> },
      { href: "/admin/reports", label: "Báo cáo", icon: <BarChart3 size={20} /> },
    ],
    [],
  );

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  const activeLabel = useMemo(() => {
    const found =
      nav.find((n) => n.href !== "/admin" && pathname?.startsWith(n.href)) ||
      nav.find((n) => n.href === "/admin" && pathname === "/admin");
    return found?.label || "Tổng quan";
  }, [pathname, nav]);

  const Sidebar = (
    <aside
      className={[
        "rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden",
        "h-[calc(100vh-2rem)]",
      ].join(" ")}
    >
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/brand/logo.png"
            alt="VivuPlan"
            className="h-16 w-auto object-contain"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">VivuPlan</div>
            <div className="text-xs text-slate-500">Quản trị</div>
          </div>
        </Link>
      </div>

      <div className="px-3 py-4">
        <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400">
          CHÍNH
        </div>

        <nav className="mt-3 grid gap-1">
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className={[
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-[#0891b2] text-white shadow-sm"
                    : "text-slate-700 hover:bg-[#0891b2]/10 hover:text-[#0891b2]",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid place-items-center h-9 w-9 rounded-xl",
                    active ? "bg-white/15" : "bg-slate-100",
                  ].join(" ")}
                >
                  {n.icon}
                </span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="my-4 h-px bg-slate-100" />

        <div className="grid gap-2">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition text-slate-700 hover:bg-[#0891b2]/10 hover:text-[#0891b2]"
          >
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100">
              <Home size={20} />
            </span>
            <span>Trang chủ</span>
          </Link>

          <button
            onClick={async () => {
              setMenuOpen(false);
              await logout();
            }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition text-rose-600 hover:bg-rose-50"
          >
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-rose-100/50">
              <LogOut size={20} />
            </span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <div className="hidden lg:block">{Sidebar}</div>

          {menuOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <button
                aria-label="Đóng menu"
                className="absolute inset-0 bg-black/30"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute left-4 top-4 bottom-4 w-[320px] max-w-[85vw]">
                {Sidebar}
              </div>
            </div>
          )}

          <section className="min-w-0">
            <div className="">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="opacity-70">🏠</span>
                      <span>Trang</span>
                    </span>
                    <span className="opacity-50">/</span>
                    <span className="font-semibold text-slate-700">
                      {activeLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    className="lg:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
                    aria-label="Mở menu"
                  >
                    <Menu size={20} />
                  </button>

                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="grid place-items-center h-8 w-8 rounded-xl bg-[#0891b2]/10 text-[#0891b2] font-bold">
                      {user?.email?.charAt(0).toUpperCase() || "A"}
                    </span>
                    <div className="text-sm font-semibold text-slate-800">
                      {user?.email?.split('@')[0] || "Quản trị"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
