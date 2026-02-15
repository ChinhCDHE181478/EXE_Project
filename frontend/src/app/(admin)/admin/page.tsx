"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type DashboardStats = {
  totalUsers: number;
  totalRevenue: number;
  newUsersToday: number;
};

type StatsResponse = {
  labels: string[];
  data: number[];
  label: string;
};

type BaseJsonResponse<T> = {
  status: string;
  code: string | null;
  message: string;
  result: T;
};

const fmtNumber = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {hint && <div className="mt-1 text-sm text-slate-500">{hint}</div>}
        </div>

        <div className="shrink-0 h-12 w-12 rounded-2xl bg-[#0891b2] text-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart
  const [rev, setRev] = useState<StatsResponse | null>(null);
  const [revLoading, setRevLoading] = useState(true);
  const [revError, setRevError] = useState<string | null>(null);

  const cards = useMemo(
    () => [
      {
        title: "Tổng người dùng",
        getValue: () =>
          loading ? "—" : stats ? fmtNumber(stats.totalUsers) : "—",
        hint: error ? "Không tải được dữ liệu" : undefined,
        icon: (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13z" />
          </svg>
        ),
      },
      {
        title: "Tổng doanh thu",
        getValue: () =>
          loading ? "—" : stats ? `${fmtNumber(stats.totalRevenue)}₫` : "—",
        hint: error ? "Không tải được dữ liệu" : undefined,
        icon: (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <path d="M12 1a11 11 0 100 22 11 11 0 000-22zm1 17.93V20h-2v-1.07a8.99 8.99 0 01-4.62-2.12l1.42-1.42A6.98 6.98 0 0011 17.9V14h-1a4 4 0 010-8h1V4h2v2h1a6 6 0 014.24 1.76l-1.42 1.42A3.99 3.99 0 0013 8.07V12h1a4 4 0 010 8h-1zM11 8h-1a2 2 0 000 4h1V8zm2 10h1a2 2 0 000-4h-1v4z" />
          </svg>
        ),
      },
      {
        title: "Người dùng mới hôm nay",
        getValue: () =>
          loading ? "—" : stats ? fmtNumber(stats.newUsersToday) : "—",
        hint: error ? "Không tải được dữ liệu" : undefined,
        icon: (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
            <path d="M15 12c2.21 0 4-1.79 4-4S17.21 4 15 4s-4 1.79-4 4 1.79 4 4 4zm-9 0c2.21 0 4-1.79 4-4S8.21 4 6 4 2 5.79 2 8s1.79 4 4 4zm0 2c-3.33 0-6 1.67-6 4v2h12v-2c0-2.33-2.67-4-6-4zm9 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h8v-2c0-2.33-3.58-4-9-4z" />
          </svg>
        ),
      },
    ],
    [loading, stats, error],
  );

  const quick = useMemo(
    () => [
      {
        href: "/admin/payments",
        title: "Thanh toán",
        desc: "Quản lý giao dịch",
      },
      { href: "/admin/users", title: "Người dùng", desc: "Quản lý người dùng" },
      { href: "/admin/reports", title: "Báo cáo", desc: "Biểu đồ thống kê" },
    ],
    [],
  );

  const chartData = useMemo(() => {
    if (!rev) return [];
    return rev.labels.map((lb, i) => ({
      name: lb,
      value: rev.data[i] ?? 0,
    }));
  }, [rev]);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "";

      // ✅ mặc định 7 ngày gần nhất (tự tính theo thời gian hiện tại)
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);

      const startDate = toYmd(start);
      const endDate = toYmd(end);

      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<BaseJsonResponse<DashboardStats>>(
          `${baseURL}/admin/dashboard`,
        );
        if (!mounted) return;
        setStats(res.data.result);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Không tải được dữ liệu tổng quan");
        setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }

      try {
        setRevLoading(true);
        setRevError(null);

        const res2 = await axios.get<BaseJsonResponse<StatsResponse>>(
          `${baseURL}/admin/stats/revenue`,
          {
            params: {
              type: "DAY",
              startDate,
              endDate,
            },
          },
        );

        if (!mounted) return;
        setRev(res2.data.result);
      } catch (e: any) {
        if (!mounted) return;
        setRevError(e?.message || "Không tải được biểu đồ doanh thu");
        setRev(null);
      } finally {
        if (mounted) setRevLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900">
            Tổng quan
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Thống kê nhanh hệ thống và điều hướng tới các module.
          </div>
        </div>

        <Link
          href="/admin/reports"
          className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Xem báo cáo
        </Link>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <StatCard
            key={c.title}
            title={c.title}
            value={c.getValue()}
            hint={c.hint}
            icon={c.icon}
          />
        ))}
      </div>

      {/* Main */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900">
                Doanh thu 7 ngày gần nhất
              </div>
              <div className="text-sm text-slate-500">
                Xem chi tiết & lọc nâng cao trong mục Báo cáo.
              </div>
            </div>

            <span className="shrink-0 text-xs rounded-full bg-[#0891b2]/10 text-[#0891b2] px-2 py-1 font-semibold">
              {rev ? rev.label : "Theo ngày"}
            </span>
          </div>

          <div className="mt-4 h-[240px] sm:h-[280px] rounded-xl border border-slate-200 bg-white p-3">
            {revLoading ? (
              <div className="h-full rounded-xl bg-slate-50 flex items-center justify-center text-sm text-slate-500">
                Đang tải biểu đồ...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full rounded-xl bg-slate-50 flex items-center justify-center text-sm text-slate-500">
                Chưa có dữ liệu để vẽ biểu đồ
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {revError && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-semibold text-slate-900">Có lỗi</div>
              <div className="mt-1 text-sm text-slate-600">{revError}</div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-base font-semibold text-slate-900">
            Truy cập nhanh
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Đi nhanh tới các chức năng chính.
          </div>

          <div className="mt-4 grid gap-3">
            {quick.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-[#0891b2]/10 transition"
              >
                <div className="font-semibold text-slate-900">{q.title}</div>
                <div className="text-sm text-slate-500">{q.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="font-semibold text-slate-900">
            Không tải được dữ liệu tổng quan
          </div>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
          <p className="mt-2 text-xs text-slate-500">
            Gợi ý: set{" "}
            <code className="px-1 rounded bg-slate-100">
              NEXT_PUBLIC_API_URL
            </code>{" "}
            ={" "}
            <code className="px-1 rounded bg-slate-100">
              http://localhost:8080/api/v1
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
