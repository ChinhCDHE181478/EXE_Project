"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../_lib/api";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Users,
  Package,
  Calendar,
  RefreshCcw,
  RotateCcw
} from "lucide-react";

type StatsResponse = {
  labels: string[];
  data: number[];
  label?: string;
};

type BaseJsonResponse<T> = {
  status: string;
  code: string | null;
  message: string;
  result: T;
};

type ReportTab = "revenue" | "users" | "package";

const fmtMoney = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)}₫`;
const fmtNumber = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

function Card({
  title,
  desc,
  children,
  right,
}: {
  title?: string;
  desc?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
      <div className={(title || desc || right) ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

function Tab({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${active
          ? "bg-[#0891b2] text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function toRows(stats: StatsResponse | null) {
  if (!stats) return [];
  return stats.labels.map((lb, i) => ({
    label: lb,
    value: stats.data[i] ?? 0,
  }));
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("revenue");
  const [type, setType] = useState<"DAY" | "MONTH">("DAY");

  // ✅ Initialize with last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [applied, setApplied] = useState<{
    tab: ReportTab;
    type: "DAY" | "MONTH";
    startDate: string;
    endDate: string;
  }>({
    tab: "revenue",
    type: "DAY",
    startDate: "",
    endDate: "",
  });

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    if (applied.tab === "users") return "/admin/stats/users";
    if (applied.tab === "package") return "/admin/stats/revenue-by-package";
    return "/admin/stats/revenue";
  }, [applied.tab]);

  const params = useMemo(() => {
    const p: Record<string, any> = {};
    if (applied.tab !== "package") p.type = applied.type;
    if (applied.startDate) p.startDate = applied.startDate;
    if (applied.endDate) p.endDate = applied.endDate;
    return p;
  }, [applied]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const res = await api.get<BaseJsonResponse<StatsResponse>>(endpoint, {
        params,
      });
      setStats(res.data.result);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Không tải được báo cáo");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Sync applied on first mount or filter change
  useEffect(() => {
    if (!applied.startDate) {
      setApplied({ tab, type, startDate, endDate });
    } else {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  function applyFilters() {
    setApplied({ tab, type, startDate, endDate });
  }

  function resetFilters() {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().split("T")[0];
    const endStr = new Date().toISOString().split("T")[0];

    setTab("revenue");
    setType("DAY");
    setStartDate(startStr);
    setEndDate(endStr);
    setApplied({ tab: "revenue", type: "DAY", startDate: startStr, endDate: endStr });
  }

  const rows = useMemo(() => toRows(stats), [stats]);
  const chartData = useMemo(() => rows.map((r) => ({ name: r.label, value: r.value })), [rows]);

  const chartTitle =
    applied.tab === "revenue"
      ? "Doanh thu"
      : applied.tab === "users"
        ? "Người dùng mới"
        : "Doanh thu theo gói";

  const isMoney = applied.tab === "revenue" || applied.tab === "package";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Báo cáo & Thống kê
          </h1>
          <p className="text-sm text-slate-500">
            Phân tích hiệu quả kinh doanh và tăng trưởng người dùng.
          </p>
        </div>
      </div>

      {/* TABS SELECTION */}
      <div className="flex flex-wrap items-center gap-2">
        <Tab
          label="Doanh thu"
          icon={TrendingUp}
          active={tab === "revenue"}
          onClick={() => setTab("revenue")}
        />
        <Tab
          label="Người dùng"
          icon={Users}
          active={tab === "users"}
          onClick={() => setTab("users")}
        />
        <Tab
          label="Theo gói"
          icon={Package}
          active={tab === "package"}
          onClick={() => setTab("package")}
        />
      </div>

      {/* FILTER CARD */}
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đơn vị thời gian
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                disabled={tab === "package"}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="DAY">Theo Ngày</option>
                <option value="MONTH">Theo Tháng</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Từ ngày
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đến ngày
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
              />
            </div>
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Đặt lại
            </button>
          </div>
        </div>
      </Card>

      {/* MAIN CONTENT GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CHART SECTION */}
        <div className="lg:col-span-2">
          <Card
            title={chartTitle}
            desc={applied.tab === "package" ? "Phân bổ doanh thu theo từng gói dịch vụ." : "Biểu đồ xu hướng tăng trưởng."}
            right={
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">
                <Calendar size={12} />
                {applied.tab === "package" ? "Nhóm theo gói" : applied.type === "DAY" ? "Theo ngày" : "Theo tháng"}
              </div>
            }
          >
            <div className="h-[300px] sm:h-[400px] w-full mt-2">
              {loading ? (
                <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
                  Đang truy xuất dữ liệu...
                </div>
              ) : rows.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
                  Không có dữ liệu trong khoảng thời gian này
                </div>
              ) : applied.tab === "package" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(val: number) => isMoney ? `${val / 1000}k` : String(val)} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      formatter={(val: any) => [isMoney ? fmtMoney(Number(val)) : fmtNumber(Number(val)), chartTitle]}
                    />
                    <Bar dataKey="value" fill="#0891b2" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(val: number) => isMoney ? `${val / 1000}k` : String(val)} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      formatter={(val: any) => [isMoney ? fmtMoney(Number(val)) : fmtNumber(Number(val)), chartTitle]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            {err && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
                <span className="font-bold">Lỗi:</span> {err}
              </div>
            )}
          </Card>
        </div>

        {/* TABLE SECTION */}
        <div className="lg:col-span-1">
          <Card
            title="Chi tiết thực tế"
            desc={applied.tab === "package" ? "Số liệu theo gói dịch vụ" : "Dữ liệu theo mốc thời gian"}
          >
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">{applied.tab === "package" ? "Gói" : "Thời gian"}</th>
                    <th className="px-4 py-3 text-right">Giá trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-400">Đang tải biểu mẫu...</td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-slate-400">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={i} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 font-medium">{r.label}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {isMoney ? fmtMoney(r.value) : fmtNumber(r.value)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && rows.length > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#0891b2]/5 p-4 border border-[#0891b2]/10">
                <div className="text-xs font-bold uppercase text-[#0891b2]">Tổng cộng</div>
                <div className="text-lg font-black text-slate-900">
                  {isMoney
                    ? fmtMoney(rows.reduce((sum, r) => sum + r.value, 0))
                    : fmtNumber(rows.reduce((sum, r) => sum + r.value, 0))
                  }
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
