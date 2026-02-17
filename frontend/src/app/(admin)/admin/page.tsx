"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "../_lib/api";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  DollarSign,
  UserPlus,
  ArrowRight,
  CreditCard,
  BarChart3,
  Settings,
  LayoutDashboard
} from "lucide-react";

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
const fmtMoney = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)}₫`;

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
  icon: Icon,
  color = "bg-[#0891b2]",
}: {
  title: string;
  value: string;
  hint?: string;
  icon: any;
  color?: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </div>
          {hint && <div className="mt-1 text-sm font-medium text-slate-400">{hint}</div>}
        </div>

        <div className={`shrink-0 h-14 w-14 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg transform transition group-hover:scale-110`}>
          <Icon size={24} />
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
        hint: error ? "Lỗi tải dữ liệu" : "Tất cả tài khoản",
        icon: Users,
        color: "bg-[#0891b2]",
      },
      {
        title: "Tổng doanh thu",
        getValue: () =>
          loading ? "—" : stats ? fmtMoney(stats.totalRevenue) : "—",
        hint: error ? "Lỗi tải dữ liệu" : "Doanh thu tích lũy",
        icon: DollarSign,
        color: "bg-emerald-600",
      },
      {
        title: "User mới hôm nay",
        getValue: () =>
          loading ? "—" : stats ? fmtNumber(stats.newUsersToday) : "—",
        hint: error ? "Lỗi tải dữ liệu" : "Số lượng đăng ký mới",
        icon: UserPlus,
        color: "bg-amber-500",
      },
    ],
    [loading, stats, error],
  );

  const quick = useMemo(
    () => [
      {
        href: "/admin/payments",
        title: "Thanh toán",
        desc: "Quản lý dòng tiền & đối soát",
        icon: CreditCard,
        color: "text-blue-600 bg-blue-50",
      },
      {
        href: "/admin/users",
        title: "Người dùng",
        desc: "Phân quyền & hỗ trợ user",
        icon: Users,
        color: "text-purple-600 bg-purple-50",
      },
      {
        href: "/admin/reports",
        title: "Báo cáo",
        desc: "Thống kê chuyên sâu",
        icon: BarChart3,
        color: "text-[#0891b2] bg-cyan-50",
      },
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
      // ✅ mặc định 7 ngày gần nhất
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);

      const startDate = toYmd(start);
      const endDate = toYmd(end);

      try {
        setLoading(true);
        setError(null);

        const res = await api.get<BaseJsonResponse<DashboardStats>>("/admin/dashboard");
        if (!mounted) return;
        setStats(res.data.result);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Không tải được dữ liệu tổng quan");
      } finally {
        if (mounted) setLoading(false);
      }

      try {
        setRevLoading(true);
        setRevError(null);

        const res2 = await api.get<BaseJsonResponse<StatsResponse>>("/admin/stats/revenue", {
          params: {
            type: "DAY",
            startDate,
            endDate,
          },
        });

        if (!mounted) return;
        setRev(res2.data.result);
      } catch (e: any) {
        if (!mounted) return;
        setRevError(e?.response?.data?.message || e?.message || "Không tải được biểu đồ doanh thu");
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <LayoutDashboard className="text-[#0891b2]" size={28} />
            Hệ thống quản trị
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">
            Chào mừng trở lại! Dưới đây là dữ liệu mới nhất từ hệ thống.
          </div>
        </div>

        <Link
          href="/admin/reports"
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0891b2] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
        >
          Phân tích chi tiết
          <ArrowRight size={18} className="transition group-hover:translate-x-1" />
        </Link>
      </div>

      {/* KPI */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <StatCard
            key={c.title}
            title={c.title}
            value={c.getValue()}
            hint={c.hint}
            icon={c.icon}
            color={c.color}
          />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="text-lg font-bold text-slate-900">
                Xu hướng doanh thu
              </div>
              <div className="text-sm font-medium text-slate-500">
                Hiển thị dữ liệu 7 ngày gần nhất.
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-600">
              <BarChart3 size={14} className="text-[#0891b2]" />
              {rev?.label || "Theo ngày"}
            </div>
          </div>

          <div className="mt-6 h-[280px] sm:h-[340px] w-full">
            {revLoading ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-400">
                Đang nạp dữ liệu...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-400">
                Chưa có dữ liệu giao dịch
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
                    formatter={(val: any) => [fmtMoney(Number(val)), "Doanh thu"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0891b2"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#dashboardRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {revError && (
            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm font-medium text-rose-600">
              <div className="font-bold uppercase tracking-wider text-[10px]">Lỗi hệ thống</div>
              <div className="mt-1">{revError}</div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Settings className="text-slate-400" size={20} />
            Lối tắt nhanh
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">
            Truy cập các khu vực quản lý thường xuyên.
          </div>

          <div className="mt-6 grid gap-4">
            {quick.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-[#0891b2]/30 hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${q.color} transition group-hover:scale-110`}>
                  <q.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 group-hover:text-[#0891b2] transition">{q.title}</div>
                  <div className="text-xs font-medium text-slate-400">{q.desc}</div>
                </div>
                <ArrowRight size={16} className="text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Global Error Notification */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-100 text-rose-600">
            !
          </div>
          <div>
            <div className="font-bold text-slate-900">Lỗi kết nối máy chủ</div>
            <p className="text-sm font-medium text-slate-500">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
