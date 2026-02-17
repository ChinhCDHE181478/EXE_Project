"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../_lib/api";

type PaymentStatus = "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";

type Payment = {
  id: number;
  userId: number;
  packageId: number;
  orderCode: number;
  amount: number;
  status: PaymentStatus;
  paymentGateway: string;
  payosPaymentLinkId?: string | null;
  payosTransactionId?: string | null;
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

const fmtMoney = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)}₫`;
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));

const statusLabel: Record<PaymentStatus, string> = {
  SUCCESS: "Thành công",
  PENDING: "Đang chờ",
  FAILED: "Thất bại",
  CANCELLED: "Đã huỷ",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function StatusBadge({ s }: { s: PaymentStatus }) {
  const map: Record<PaymentStatus, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    FAILED: "bg-rose-50 text-rose-700 border-rose-200",
    CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${map[s]}`}
      title={s}
    >
      {statusLabel[s]}
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
  const showHeader = Boolean(title || desc || right);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {showHeader && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <div className="text-base font-semibold text-slate-900">
                {title}
              </div>
            )}
            {desc && <div className="mt-1 text-sm text-slate-500">{desc}</div>}
          </div>
          {right}
        </div>
      )}

      <div className={showHeader ? "mt-4" : ""}>{children}</div>
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

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  /**
   * ✅ 1) FILTER INPUT (nhập liệu - KHÔNG tự lọc)
   */
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [userId, setUserId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  /**
   * ✅ 2) APPLIED FILTER (đã áp dụng - chỉ đổi khi bấm "Áp dụng"/"Đặt lại")
   */
  const [applied, setApplied] = useState<{
    status: PaymentStatus | "";
    userId: string;
    startDate: string;
    endDate: string;
  }>({
    status: "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  const [data, setData] = useState<PageResult<Payment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // update modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [uStatus, setUStatus] = useState<PaymentStatus | "">("");
  const [uAmount, setUAmount] = useState<string>("");

  /**
   * ✅ Query chỉ phụ thuộc applied + page/size
   * -> filter KHÔNG tự chạy khi user đang nhập
   */
  const query = useMemo(() => {
    const params: Record<string, any> = { page: page - 1, size };

    if (applied.status) params.status = applied.status;
    if (applied.userId) params.userId = Number(applied.userId);
    if (applied.startDate) params.startDate = applied.startDate;
    if (applied.endDate) params.endDate = applied.endDate;

    return params;
  }, [page, size, applied]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const res = await api.get<BaseJsonResponse<PageResult<Payment>>>(
        "/admin/payments",
        { params: query }
      );
      setData(res.data.result);
    } catch (e: any) {
      setErr(e?.message || "Không tải được danh sách thanh toán");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * ✅ Chỉ auto reload khi:
   * - đổi trang / đổi size / đổi APPLIED FILTER
   */
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function applyFilters() {
    setApplied({ status, userId, startDate, endDate });
    setPage(1);
  }

  function resetFilters() {
    // reset input
    setStatus("");
    setUserId("");
    setStartDate("");
    setEndDate("");
    setPage(1);

    // reset applied (và tự load lại list all)
    setApplied({ status: "", userId: "", startDate: "", endDate: "" });
  }

  function openUpdate(p: Payment) {
    setEditing(p);
    setUStatus(p.status);
    setUAmount(String(p.amount ?? ""));
    setOpen(true);
  }

  async function submitUpdate() {
    if (!editing) return;

    try {
      setErr(null);

      const payload: any = {};

      if (uStatus && uStatus !== editing.status) {
        payload.status = uStatus;
      }

      const trimmed = uAmount.trim();
      if (trimmed !== "") {
        const num = Number(trimmed);
        if (Number.isNaN(num)) {
          setErr("Số tiền không hợp lệ");
          return;
        }
        if (num !== editing.amount) payload.amount = num;
      }

      if (Object.keys(payload).length === 0) {
        setOpen(false);
        setEditing(null);
        return;
      }

      await api.put(`/admin/payments/${editing.id}`, payload);

      setOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Cập nhật thất bại");
    }
  }

  return (
    <div className="space-y-6">
      {/* header row inside page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Thanh toán
          </h1>
          <p className="text-sm text-slate-500">
            Danh sách giao dịch, lọc và cập nhật trạng thái/số tiền.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Về Tổng quan
        </Link>
      </div>

      {/* ✅ BỎ CHỮ "BỘ LỌC" + BỎ DESC (header không chiếm chỗ) */}
      <Card title="">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">
              Trạng thái
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="PENDING">Đang chờ</option>
              <option value="FAILED">Thất bại</option>
              <option value="CANCELLED">Đã huỷ</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">
              ID người dùng
            </div>
            <input
              value={userId}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => setUserId(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="VD: 1"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Từ ngày</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-600">Đến ngày</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 xl:flex xl:items-end">
            <button
              onClick={applyFilters}
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
        </div>
      </Card>

      <Card
        title="Danh sách thanh toán"
        desc="Bảng giao dịch (phân trang)."
        right={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Pill>
              {loading
                ? "Đang tải..."
                : data
                  ? `${data.totalElements} giao dịch`
                  : "0 giao dịch"}
            </Pill>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
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
        {/* ✅ GIẢM ĐỘ DÀI DANH SÁCH */}
        <div className="min-h-[360px] lg:min-h-[420px]">
          {/* MOBILE LIST VIEW */}
          <div className="grid gap-3 md:hidden">
            {loading && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500">
                Đang tải...
              </div>
            )}

            {!loading && (!data || data.content.length === 0) && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500">
                Chưa có thanh toán.
              </div>
            )}

            {!loading &&
              data?.content?.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">#{p.id}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Tạo lúc: {fmtTime(p.createAt)}
                      </div>
                    </div>
                    <StatusBadge s={p.status} />
                  </div>

                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Người dùng</span>
                      <span className="font-semibold text-slate-800">
                        {p.userId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Mã đơn</span>
                      <span className="font-semibold text-slate-800">
                        {p.orderCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Số tiền</span>
                      <span className="font-semibold text-slate-900">
                        {fmtMoney(p.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={() => openUpdate(p)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Cập nhật
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* DESKTOP/TABLET TABLE VIEW */}
          <div className="hidden md:block">
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[420px] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Người dùng</th>
                    <th className="px-4 py-3 font-semibold">Mã đơn</th>
                    <th className="px-4 py-3 font-semibold">Số tiền</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Tạo lúc</th>
                    <th className="px-4 py-3 font-semibold">Cổng</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading && (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={7}>
                        Đang tải...
                      </td>
                    </tr>
                  )}

                  {!loading && (!data || data.content.length === 0) && (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={7}>
                        Chưa có thanh toán.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    data?.content?.map((p) => (
                      <tr key={p.id} className="hover:bg-[#0891b2]/5">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          #{p.id}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{p.userId}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {p.orderCode}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-semibold">
                          {fmtMoney(p.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge s={p.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {fmtTime(p.createAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Pill>{p.paymentGateway}</Pill>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openUpdate(p)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                          >
                            Cập nhật
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* pagination */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-600">
              Trang{" "}
              <span className="font-semibold">{(data?.number ?? 0) + 1}</span> /{" "}
              <span className="font-semibold">{data?.totalPages ?? 1}</span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              <button
                disabled={!data || data.first}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
        </div>
      </Card>

      {/* update modal */}
      <Modal
        open={open}
        title={`Cập nhật thanh toán${editing ? ` #${editing.id}` : ""}`}
        onClose={() => setOpen(false)}
      >
        <div className="grid gap-3">
          <div className="grid gap-1">
            <div className="text-xs font-semibold text-slate-600">
              Trạng thái
            </div>
            <select
              value={uStatus}
              onChange={(e) => setUStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
            >
              <option value="SUCCESS">Thành công</option>
              <option value="PENDING">Đang chờ</option>
              <option value="FAILED">Thất bại</option>
              <option value="CANCELLED">Đã huỷ</option>
            </select>
          </div>

          <div className="grid gap-1">
            <div className="text-xs font-semibold text-slate-600">Số tiền</div>
            <input
              value={uAmount}
              onChange={(e) => setUAmount(e.target.value)}
              placeholder="VD: 100000"
              inputMode="numeric"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0891b2]/20"
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
              onClick={submitUpdate}
              className="rounded-xl bg-[#0891b2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Lưu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
