"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../_lib/api";
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserPen,
  Mail,
  UserCheck,
  UserMinus,
  LayoutDashboard,
  RefreshCw,
  RotateCcw,
  CalendarDays,
  MoreVertical
} from "lucide-react";

type Role = "USER" | "ADMIN";

type User = {
  id: number;
  email: string;
  role: Role;
  deleteFlag: boolean;
  createAt: string;
  updateAt: string;
};

type PageResult<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

type BaseJsonResponse<T> = {
  status: string;
  code: string | null;
  message: string;
  result: T;
};

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));

const roleLabel: Record<Role, string> = {
  USER: "Người dùng",
  ADMIN: "Quản trị",
};

function Pill({ children, color = "slate" }: { children: React.ReactNode, color?: string }) {
  const colors: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    cyan: "border-[#0891b2]/20 bg-[#0891b2]/5 text-[#0891b2]",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold leading-5 ${colors[color]}`}>
      {children}
    </span>
  );
}

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
  const showHeader = Boolean(title || desc || right);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <div className="text-lg font-bold text-slate-900 leading-none">
                {title}
              </div>
            )}
            {desc && <div className="mt-2 text-sm font-medium text-slate-500">{desc}</div>}
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
      )}

      <div className={showHeader ? "mt-6" : ""}>{children}</div>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="text-lg font-bold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [isBlocked, setIsBlocked] = useState<"" | "true" | "false">("");
  const [isSubscribed, setIsSubscribed] = useState<"" | "true" | "false">("");

  const [applied, setApplied] = useState<{
    email: string;
    role: Role | "";
    isBlocked: "" | "true" | "false";
    isSubscribed: "" | "true" | "false";
  }>({
    email: "",
    role: "",
    isBlocked: "",
    isSubscribed: "",
  });

  const [data, setData] = useState<PageResult<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // extend modal
  const [open, setOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [extType, setExtType] = useState<"DAY" | "MONTH">("DAY");
  const [extAmount, setExtAmount] = useState<string>("30");
  const [submitting, setSubmitting] = useState(false);

  const query = useMemo(() => {
    const params: Record<string, any> = { page: page - 1, size };

    if (applied.email) params.email = applied.email;
    if (applied.role) params.role = applied.role;
    if (applied.isBlocked) params.isBlocked = applied.isBlocked === "true";
    if (applied.isSubscribed)
      params.isSubscribed = applied.isSubscribed === "true";

    return params;
  }, [page, size, applied]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const res = await api.get<BaseJsonResponse<PageResult<User>>>(
        "/admin/users",
        { params: query }
      );
      setData(res.data.result);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Không tải được danh sách người dùng");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function applyFilters() {
    setApplied({ email, role, isBlocked, isSubscribed });
    setPage(1);
  }

  function resetFilters() {
    setEmail("");
    setRole("");
    setIsBlocked("");
    setIsSubscribed("");
    setPage(1);
    setApplied({ email: "", role: "", isBlocked: "", isSubscribed: "" });
  }

  function openExtend(userId: number) {
    setTargetUserId(userId);
    setExtType("DAY");
    setExtAmount("30");
    setOpen(true);
  }

  async function submitExtend() {
    if (!targetUserId) return;
    try {
      setSubmitting(true);
      setErr(null);

      const trimmed = extAmount.trim();
      const num = Number(trimmed);
      if (trimmed === "" || Number.isNaN(num) || num <= 0) {
        setErr("Số lượng không hợp lệ");
        return;
      }

      await api.post("/admin/users/subscription/extend", {
        userId: targetUserId,
        type: extType,
        amount: num,
      });

      setOpen(false);
      setTargetUserId(null);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Gia hạn thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <Users className="text-[#0891b2]" size={28} />
            Quản diện Người dùng
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Quản lý tài khoản, phân quyền và gia hạn dịch vụ.
          </p>
        </div>

        <Link
          href="/admin"
          className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
        >
          <LayoutDashboard size={18} className="text-slate-400 group-hover:text-slate-600" />
          Tổng quan
        </Link>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-widest text-[#0891b2]">
          <Filter size={14} />
          Bộ lọc tìm kiếm
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Email người dùng</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0891b2] transition" size={16} />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: user@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium outline-none ring-offset-2 focus:ring-2 focus:ring-[#0891b2]/30 focus:border-[#0891b2]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Vai trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-[#0891b2]/30 focus:border-[#0891b2]"
            >
              <option value="">Tất cả vai trò</option>
              <option value="USER">Người dùng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái chặn</label>
            <select
              value={isBlocked}
              onChange={(e) => setIsBlocked(e.target.value as any)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-[#0891b2]/30 focus:border-[#0891b2]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="false">Đang hoạt động</option>
              <option value="true">Đã bị chặn</option>
            </select>
          </div>

          <div className="flex items-end gap-2 xl:col-span-1">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0891b2] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              <Search size={18} />
              Tìm
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              title="Đặt lại"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái gói dịch vụ</label>
            <select
              value={isSubscribed}
              onChange={(e) => setIsSubscribed(e.target.value as any)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold outline-none ring-offset-2 focus:ring-2 focus:ring-[#0891b2]/30 focus:border-[#0891b2]"
            >
              <option value="">Tất cả người dùng</option>
              <option value="true">Đã đăng ký gói</option>
              <option value="false">Chưa đăng ký gói</option>
            </select>
          </div>
        </div>
      </Card>

      {/* List Card */}
      <Card
        title="Danh sách hội viên"
        desc="Quản lý thông tin và trạng thái đăng ký của từng thành viên."
        right={
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#0891b2]/20 bg-[#0891b2]/5 px-3 py-1.5">
              <UserCheck size={14} className="text-[#0891b2]" />
              <span className="text-xs font-bold text-[#0891b2]">
                {loading ? "..." : data?.totalElements ?? 0} thành viên
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Hiển thị:</span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none"
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>
          </div>
        }
      >
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <RefreshCw className="text-[#0891b2] animate-spin mb-4" size={32} />
            <p className="text-sm font-bold text-slate-500">Đang truy xuất dữ liệu từ máy chủ...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && (!data || data.content.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Users className="text-slate-300 mb-4" size={48} />
            <p className="text-sm font-bold text-slate-500">Không tìm thấy người dùng nào phù hợp</p>
            <button onClick={resetFilters} className="mt-4 text-[#0891b2] font-bold text-xs hover:underline uppercase tracking-widest">Xoá bộ lọc</button>
          </div>
        )}

        {/* MOBILE CARDS VIEW */}
        <div className="grid gap-4 md:hidden">
          {!loading &&
            data?.content?.map((u) => (
              <div
                key={u.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-[#0891b2]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">UID: #{u.id}</span>
                  <div className="flex items-center gap-2">
                    <Pill color={u.role === "ADMIN" ? "cyan" : "slate"}>
                      {roleLabel[u.role]}
                    </Pill>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold break-all">
                    <Mail size={16} className="text-slate-400 shrink-0" />
                    {u.email}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Trạng thái</span>
                    {u.deleteFlag ? (
                      <Pill color="rose">Bị chặn</Pill>
                    ) : (
                      <Pill color="emerald">Hoạt động</Pill>
                    )}
                  </div>

                  <button
                    onClick={() => openExtend(u.id)}
                    className="flex items-center gap-2 rounded-xl bg-[#0891b2]/10 px-4 py-2 text-xs font-bold text-[#0891b2] hover:bg-[#0891b2] hover:text-white transition"
                  >
                    <CalendarDays size={14} />
                    Gia hạn gói
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    Tạo lúc: {fmtTime(u.createAt)}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="px-6 py-4">Thành viên</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4 text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {!loading &&
                data?.content?.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black text-white shadow-sm ${u.role === "ADMIN" ? "bg-slate-800" : "bg-[#0891b2]"}`}>
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-[200px]">{u.email}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Pill color={u.role === "ADMIN" ? "cyan" : "slate"}>
                        {roleLabel[u.role]}
                      </Pill>
                    </td>
                    <td className="px-6 py-4 text-slate-800">
                      {u.deleteFlag ? (
                        <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                          <UserMinus size={16} />
                          Bị chặn
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <UserCheck size={16} />
                          Hoạt động
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {fmtTime(u.createAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openExtend(u.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#0891b2]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#0891b2] transition hover:bg-[#0891b2] hover:text-white"
                      >
                        <UserPen size={14} />
                        Gia hạn
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Trang <span className="text-slate-900">{(data?.number ?? 0) + 1}</span> / <span className="text-slate-900">{data?.totalPages ?? 1}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={!data || data.first || loading}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
            >
              <ChevronLeft size={18} className="transition group-hover:-translate-x-0.5" />
              Trước
            </button>
            <button
              disabled={!data || data.last || loading}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
            >
              Sau
              <ChevronRight size={18} className="transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100 text-sm font-bold text-rose-600">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-rose-200 text-rose-700 shrink-0">!</div>
            <div className="flex-1">
              <div className="uppercase text-[10px] font-black tracking-widest leading-none mb-1">Cảnh báo hệ thống</div>
              {err}
            </div>
          </div>
        )}
      </Card>

      {/* Subscription Extension Modal */}
      <Modal
        open={open}
        title="Gia hạn gói hội viên"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#0891b2] text-white font-black text-lg">
              {targetUserId}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#0891b2] mb-0.5">Mã người dùng</div>
              <div className="text-sm font-bold text-slate-900 truncate">ID: {targetUserId}</div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Đơn vị thời gian</label>
              <select
                value={extType}
                onChange={(e) => setExtType(e.target.value as any)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none border focus:border-[#0891b2] focus:ring-4 focus:ring-[#0891b2]/10"
              >
                <option value="DAY">Theo ngày</option>
                <option value="MONTH">Theo tháng</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Số lượng gia hạn</label>
              <div className="relative">
                <input
                  value={extAmount}
                  onChange={(e) => setExtAmount(e.target.value)}
                  placeholder="VD: 30"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none border focus:border-[#0891b2] focus:ring-4 focus:ring-[#0891b2]/10"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 tracking-widest uppercase">
                  {extType === "DAY" ? "Ngày" : "Tháng"}
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400 italic mt-1.5">
                Lưu ý: Thời gian sẽ được cộng dồn vào hạn dùng hiện tại của người dùng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              Huỷ bỏ
            </button>
            <button
              onClick={submitExtend}
              disabled={submitting}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-[#0891b2] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="animate-spin" size={18} /> : <UserCheck size={18} />}
              {submitting ? "Đang xử lý..." : "Xác nhận gia hạn"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
