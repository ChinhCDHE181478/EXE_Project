// src/app/(admin)/pages/admin/page.tsx
"use client";
import Link from "next/link";

export default function AdminHome() {
  const cards = [
    {
      href: "/admin/api-usage",
      title: "API Usage & Token Tracking",
      desc: "Theo dõi call, error rate, quota, token.",
    },
    {
      href: "/admin/system-logs",
      title: "System Logs",
      desc: "Nhật ký redirect, provider, cảnh báo, lỗi.",
    },
    {
      href: "/admin/accounts",
      title: "Account Management",
      desc: "Quản lý người dùng, vai trò, khoá/mở.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="text-lg font-semibold text-slate-900">
              {c.title}
            </div>
            <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-[#0a6c86]">
              Mở bảng →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
