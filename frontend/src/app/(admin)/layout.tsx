"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );
}
function IconPayments() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.2 14h9.9c.75 0 1.4-.41 1.74-1.03L21 7H6.21L5.27 5H2v2h2l3.6 7.59-1.35 2.44C5.52 18.37 6.48 20 8 20h12v-2H8l1.2-2z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13z" />
    </svg>
  );
}
function IconReports() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M3 3h18v2H3V3zm2 4h14v14H5V7zm3 3v8h2v-8H8zm4 3v5h2v-5h-2zm4-2v7h2v-7h-2z" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M10 2a8 8 0 105.29 14.03l4.34 4.34 1.41-1.41-4.34-4.34A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L12 13.41l-6.89 6.3-1.42-1.41L10.59 12 3.69 5.71 5.1 4.29 12 10.59l6.89-6.3 1.41 1.42z" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const nav = useMemo(
    () => [
      { href: "/admin", label: "Tổng quan", icon: <IconDashboard /> },
      { href: "/admin/payments", label: "Thanh toán", icon: <IconPayments /> },
      { href: "/admin/users", label: "Người dùng", icon: <IconUsers /> },
      { href: "/admin/reports", label: "Báo cáo", icon: <IconReports /> },
    ],
    []
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
        // ✅ cao cố định, gần chạm cuối, độc lập nội dung bên phải
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

        <Link
          href="/pages/login"
          onClick={() => setMenuOpen(false)}
          className="flex items-center justify-center rounded-2xl bg-[#0891b2] px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
        >
          Đăng nhập
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* FULL WIDTH */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* ✅ DESKTOP SIDEBAR: cố định chiều cao, không phụ thuộc content bên phải */}
          <div className="hidden lg:block">{Sidebar}</div>

          {/* ✅ MOBILE DRAWER (Menu nút bấm) */}
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

          {/* RIGHT SIDE */}
          <section className="min-w-0">
            {/* TOPBAR */}
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
                  {/* ✅ Nút menu (lịch sự) */}
                  <button
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    className="lg:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
                    aria-label="Mở menu"
                  >
                    <IconMenu />
                  </button>

                  {/* ✅ Nút tìm kiếm -> bấm mới hiện */}
                  <button
                    type="button"
                    onClick={() => setSearchOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    aria-label="Mở tìm kiếm"
                  >
                    <span className="text-slate-400">
                      <IconSearch />
                    </span>
                    <span className="hidden sm:inline">Tìm kiếm</span>
                  </button>

                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="grid place-items-center h-8 w-8 rounded-xl bg-[#0891b2]/10 text-[#0891b2] font-bold">
                      N
                    </span>
                    <div className="text-sm font-semibold text-slate-800">
                      Quản trị
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Search panel: hiện/ẩn theo nút */}
              {searchOpen && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span className="text-slate-400">
                      <IconSearch />
                    </span>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Tìm kiếm (chỉ giao diện)"
                      className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="grid place-items-center h-9 w-9 rounded-xl hover:bg-slate-50 text-slate-500"
                      aria-label="Đóng tìm kiếm"
                    >
                      <IconClose />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="px-6 py-6">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
