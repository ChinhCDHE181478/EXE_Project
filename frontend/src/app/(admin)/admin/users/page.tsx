"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../_lib/api";

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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
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
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [isBlocked, setIsBlocked] = useState<"" | "true" | "false">("");
  const [isSubscribed, setIsSubscribed] = useState<"" | "true" | "false">("");

  const [data, setData] = useState<PageResult<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // extend modal
  const [open, setOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [extType, setExtType] = useState<"DAY" | "MONTH">("DAY");
  const [extAmount, setExtAmount] = useState<string>("30");

  const query = useMemo(() => {
    const params: Record<string, any> = { page, size };
    if (email) params.email = email;
    if (role) params.role = role;
    if (isBlocked) params.isBlocked = isBlocked === "true";
    if (isSubscribed) params.isSubscribed = isSubscribed === "true";
    return params;
  }, [page, size, email, role, isBlocked, isSubscribed]);

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
      setErr(e?.message || "Không tải được danh sách người dùng");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function resetFilters() {
    setEmail("");
    setRole("");
    setIsBlocked("");
    setIsSubscribed("");
    setPage(0);
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
      setErr(null);
      await api.post("/admin/users/subscription/extend", {
        userId: targetUserId,
        type: extType,
        amount: Number(extAmount),
      });
      setOpen(false);
      setTargetUserId(null);
    } catch (e: any) {
      setErr(e?.message || "Gia hạn thất bại");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Người dùng
          </h1>
          <p className="text-sm text-slate-500">
            Danh sách người dùng, lọc và gia hạn gói.
          </p>
        </div>

        {/* ✅ mobile vẫn thấy nút */}
        <Link
          href="/admin"
          className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Về Tổng quan
        </Link>
      </div>

      {/* Filters */}
      <Card
        title="Bộ lọc"
        desc="Tìm theo email / vai trò / trạng thái."
        right={<Pill>Chỉ giao diện</Pill>}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1 xl:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Email</div>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPage(0);
              }}
              placeholder="VD: user@gmail.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Vai trò</div>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as any);
                setPage(0);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
            >
              <option value="">Tất cả</option>
              <option value="USER">Người dùng</option>
              <option value="ADMIN">Quản trị</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">
              Trạng thái
            </div>
            <select
              value={isBlocked}
              onChange={(e) => {
                setIsBlocked(e.target.value as any);
                setPage(0);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="false">Đang hoạt động</option>
              <option value="true">Bị chặn</option>
            </select>
          </div>

          {/* ✅ nút luôn đủ trên mobile */}
          <div className="grid grid-cols-2 gap-2 xl:flex xl:items-end">
            <button
              onClick={() => load()}
              className="w-full rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Áp dụng
            </button>
            <button
              onClick={resetFilters}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Đặt lại
            </button>
          </div>

          {/* isSubscribed UI (tuỳ backend) */}
          <div className="space-y-1 xl:col-span-2">
            <div className="text-xs font-semibold text-slate-600">
              Đang đăng ký gói (tuỳ chọn)
            </div>
            <select
              value={isSubscribed}
              onChange={(e) => {
                setIsSubscribed(e.target.value as any);
                setPage(0);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="true">Đang đăng ký</option>
              <option value="false">Chưa đăng ký</option>
            </select>
            <div className="text-xs text-slate-400">
              * Backend có thể chưa hỗ trợ đầy đủ bộ lọc này.
            </div>
          </div>
        </div>
      </Card>

      {/* List */}
      <Card
        title="Danh sách người dùng"
        desc="Bảng người dùng (phân trang)."
        right={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Pill>
              {loading
                ? "Đang tải..."
                : data
                ? `${data.totalElements} người dùng`
                : "0 người dùng"}
            </Pill>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              aria-label="Số dòng mỗi trang"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        }
      >
        {/* ✅ MOBILE LIST VIEW */}
        <div className="grid gap-3 md:hidden">
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500">
              Đang tải...
            </div>
          )}

          {!loading && (!data || data.content.length === 0) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500">
              Không có dữ liệu.
            </div>
          )}

          {!loading &&
            data?.content?.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">#{u.id}</div>
                    <div className="mt-1 text-sm text-slate-800 break-all">
                      {u.email}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                        {roleLabel[u.role]}
                      </span>

                      {u.deleteFlag ? (
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                          Bị chặn
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Đang hoạt động
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Tạo lúc: {fmtTime(u.createAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <button
                    onClick={() => openExtend(u.id)}
                    className="rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  >
                    Gia hạn gói
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* ✅ DESKTOP/TABLET TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Vai trò</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Tạo lúc</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    Đang tải...
                  </td>
                </tr>
              )}

              {!loading && (!data || data.content.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Không có dữ liệu.
                  </td>
                </tr>
              )}

              {!loading &&
                data?.content?.map((u) => (
                  <tr key={u.id} className="hover:bg-[#0891b2]/5">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      #{u.id}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                        {roleLabel[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.deleteFlag ? (
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                          Bị chặn
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {fmtTime(u.createAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openExtend(u.id)}
                        className="rounded-xl bg-[#0891b2] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95"
                      >
                        Gia hạn
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-slate-600">
            Trang{" "}
            <span className="font-semibold">{(data?.number ?? 0) + 1}</span> /{" "}
            <span className="font-semibold">{data?.totalPages ?? 1}</span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              disabled={!data || data.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
            >
              Trước
            </button>
            <button
              disabled={!data || data.last}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
            >
              Sau
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-semibold text-slate-900">Có lỗi</div>
            <div className="mt-1 text-sm text-slate-600">{err}</div>
          </div>
        )}
      </Card>

      {/* Extend modal */}
      <Modal
        open={open}
        title={`Gia hạn gói${
          targetUserId ? ` - Người dùng #${targetUserId}` : ""
        }`}
        onClose={() => setOpen(false)}
      >
        <div className="grid gap-3">
          <div className="grid gap-1">
            <div className="text-xs font-semibold text-slate-600">Đơn vị</div>
            <select
              value={extType}
              onChange={(e) => setExtType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="DAY">Ngày</option>
              <option value="MONTH">Tháng</option>
            </select>
          </div>

          <div className="grid gap-1">
            <div className="text-xs font-semibold text-slate-600">Số lượng</div>
            <input
              value={extAmount}
              onChange={(e) => setExtAmount(e.target.value)}
              placeholder="VD: 30"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              onClick={submitExtend}
              className="rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Gia hạn
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
