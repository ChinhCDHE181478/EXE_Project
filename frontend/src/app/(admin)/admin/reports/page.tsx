"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../_lib/api";

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

function Card({
  title,
  desc,
  children,
  right,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          {desc && <div className="mt-1 text-sm text-slate-500">{desc}</div>}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#0891b2] text-white"
          : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<"revenue" | "users" | "package">("revenue");
  const [type, setType] = useState<"DAY" | "MONTH">("DAY");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-01-07");

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    if (tab === "users") return "/admin/stats/users";
    if (tab === "package") return "/admin/stats/revenue-by-package";
    return "/admin/stats/revenue";
  }, [tab]);

  const params = useMemo(() => {
    const p: Record<string, any> = {};
    if (tab !== "package") p.type = type;
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    return p;
  }, [tab, type, startDate, endDate]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const res = await api.get<BaseJsonResponse<StatsResponse>>(endpoint, {
        params,
      });
      setStats(res.data.result);
    } catch (e: any) {
      setErr(e?.message || "Không tải được báo cáo");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, params]);

  const rows = useMemo(() => {
    if (!stats) return [];
    return stats.labels.map((lb, i) => ({
      label: lb,
      value: stats.data[i] ?? 0,
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Báo cáo
        </h1>
        <p className="text-sm text-slate-500">
          Thống kê doanh thu & người dùng theo thời gian (và theo gói).
        </p>
      </div>

      <Card
        title="Loại báo cáo"
        desc="Chọn loại thống kê và khoảng thời gian."
        right={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Tab
              label="Doanh thu"
              active={tab === "revenue"}
              onClick={() => setTab("revenue")}
            />
            <Tab
              label="Người dùng"
              active={tab === "users"}
              onClick={() => setTab("users")}
            />
            <Tab
              label="Theo gói"
              active={tab === "package"}
              onClick={() => setTab("package")}
            />
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Đơn vị</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              disabled={tab === "package"}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60"
            >
              <option value="DAY">Ngày</option>
              <option value="MONTH">Tháng</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Từ ngày</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Đến ngày</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          {/* ✅ mobile không thiếu nút */}
          <div className="flex items-end sm:col-span-2 xl:col-span-1">
            <button
              onClick={load}
              className="w-full rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Làm mới
            </button>
          </div>

          <div className="flex items-end sm:col-span-2 xl:col-span-1">
            <div className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 truncate">
              {loading
                ? "Đang tải..."
                : stats
                ? stats.label
                : "Chưa có dữ liệu"}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900">
                Xem trước biểu đồ
              </div>
              <div className="text-sm text-slate-500">
                Hiện là placeholder (ưu tiên UI). Sau này gắn chart library vào.
              </div>
            </div>
            <span className="shrink-0 text-xs rounded-full bg-[#0891b2]/10 text-[#0891b2] px-2 py-1 font-semibold">
              {tab === "package" ? "Nhóm theo gói" : type === "DAY" ? "Ngày" : "Tháng"}
            </span>
          </div>

          <div className="mt-4 h-[240px] sm:h-[320px] rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sm text-slate-500">
            Chỗ đặt biểu đồ
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-base font-semibold text-slate-900">Bảng dữ liệu</div>
          <div className="mt-1 text-sm text-slate-500">
            {tab === "package" ? "Doanh thu theo gói" : "Theo thời gian"}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">
                    {tab === "package" ? "Gói" : "Mốc"}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Giá trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={2}>
                      Đang tải...
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={2}>
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r) => (
                    <tr key={r.label} className="hover:bg-[#0891b2]/5">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.label}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {new Intl.NumberFormat("vi-VN").format(r.value)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {err && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-semibold text-slate-900">Có lỗi</div>
              <div className="mt-1 text-sm text-slate-600">{err}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
