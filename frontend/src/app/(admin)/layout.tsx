// src/app/(admin)/layout.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function AdminHeader() {
  const pathname = usePathname();
  const nav = [
    { href: "/admin/api-usage", label: "API Usage & Tokens" },
    { href: "/admin/system-logs", label: "System Logs" },
    { href: "/admin/accounts", label: "Accounts" },
  ];
  const isActive = (href: string) => pathname?.startsWith(href);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
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

  return (
    <header className="bg-white/90 backdrop-blur shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0891b2]/10 text-[#0891b2] font-semibold">
            V
          </span>
          <span className="text-lg font-semibold tracking-tight">VivuPlan</span>
        </Link>

        {/* Desktop menu */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[15px] ${
                isActive(n.href)
                  ? "text-[#0891b2]"
                  : "text-slate-800 hover:text-[#0891b2]"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile dropdown */}
          <div className="relative md:hidden" ref={panelRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Mở menu admin"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                {open ? (
                  <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" />
                ) : (
                  <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                )}
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-[280px] rounded-xl border bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50">
                <div className="p-2">
                  <div className="text-xs text-slate-500 px-2 py-2">Admin</div>
                  <div className="grid gap-1">
                    {nav.map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(n.href)
                            ? "bg-[#0891b2]/10 text-[#0891b2]"
                            : "text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        {n.label}
                      </Link>
                    ))}
                  </div>
                  <div className="my-2 h-px bg-slate-200" />
                  <Link
                    href="/pages/login"
                    className="block text-center px-3 py-2 rounded-lg border text-slate-800 hover:text-[#0891b2] hover:border-[#0891b2]"
                  >
                    Đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Desktop: nút login */}
          <Link
            href="/pages/login"
            className="hidden md:inline-flex px-3 py-1.5 rounded-md border text-slate-800 hover:text-[#0891b2] hover:border-[#0891b2]"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}

function AdminFooter() {
  return (
    <footer className="bg-[#0891b2]/5">
      <div className="border-t border-slate-200 text-center text-sm text-slate-600 py-4">
        © {new Date().getFullYear()} VivuPlan.
      </div>
    </footer>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminHeader />
      <main className="flex-1">{children}</main>
      <AdminFooter />
    </div>
  );
}
