// src/app/pages/profiles/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Download,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "../../AuthProvider";

// --- CONFIG ---
const BRAND = "#0891b2";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// --- TYPES ---
type TabKey = "account" | "subscription" | "alerts" | "history";

interface SubscriptionResult {
  planName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  price?: number;
}

interface PaymentRecord {
  id: number | string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  createdAt: string;
  description: string;
}

// --- HELPER FUNCTIONS ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const parseJsonSafe = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const isResponseSuccess = (payload: any) => {
  const code = String(payload?.code ?? "").trim();
  const status = String(payload?.status ?? "").trim().toLowerCase();
  return code === "200" || code === "0" || status === "success" || status === "ok";
};

const toNumber = (value: any, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizePaymentStatus = (value: any): "SUCCESS" | "FAILED" | "PENDING" => {
  const raw = String(value ?? "").toUpperCase();
  if (["SUCCESS", "SUCCEEDED", "PAID", "COMPLETED", "DONE"].includes(raw)) return "SUCCESS";
  if (["PENDING", "PROCESSING", "WAITING"].includes(raw)) return "PENDING";
  return "FAILED";
};

const normalizeSubscriptionResult = (payload: any): SubscriptionResult | null => {
  const raw = payload?.result ?? payload?.data ?? payload;
  if (!raw || typeof raw !== "object") return null;

  const statusRaw = String(raw?.status ?? "").toUpperCase();
  const isActive =
    Boolean(raw?.active) ||
    Boolean(raw?.isActive) ||
    Boolean(raw?.valid) ||
    statusRaw === "ACTIVE";

  return {
    planName: raw?.planName ?? raw?.packageName ?? raw?.packageCode ?? raw?.plan ?? "Gói dịch vụ",
    status: isActive ? "ACTIVE" : (statusRaw || "EXPIRED"),
    startDate: raw?.startDate ?? raw?.startAt ?? raw?.createdAt ?? "",
    endDate: raw?.endDate ?? raw?.expiryDate ?? raw?.expiredAt ?? raw?.endAt ?? "",
    price: toNumber(raw?.price ?? raw?.amount, 0),
  };
};

const normalizePaymentList = (payload: any): PaymentRecord[] => {
  const root = payload?.result ?? payload?.data ?? payload;
  const list =
    (Array.isArray(root) && root) ||
    (Array.isArray(root?.content) && root.content) ||
    (Array.isArray(root?.records) && root.records) ||
    (Array.isArray(root?.items) && root.items) ||
    [];

  return list.map((item: any, index: number) => ({
    id: item?.id ?? item?.paymentId ?? item?.transactionId ?? `payment-${index}`,
    transactionId: String(item?.transactionId ?? item?.txnId ?? item?.id ?? `GD-${index + 1}`),
    amount: toNumber(item?.amount ?? item?.totalAmount ?? item?.price, 0),
    paymentMethod: String(item?.paymentMethod ?? item?.method ?? "N/A"),
    status: normalizePaymentStatus(item?.status ?? item?.paymentStatus ?? item?.state),
    createdAt: item?.createdAt ?? item?.createdDate ?? item?.paymentDate ?? "",
    description: String(item?.description ?? item?.note ?? item?.packageCode ?? "Thanh toán gói dịch vụ"),
  }));
};

// --- COMPONENT CHÍNH ---
export default function ProfilePage() {
  const [tab, setTab] = useState<TabKey>("account");
  const [user, setUser] = useState({
    name: "Khách",
    email: "guest@example.com",
    id: 0
  });

  const { user: authUser } = useAuth();

  // Load user từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vivuplan_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser({
          name: parsed.displayName || parsed.name || "Người dùng",
          email: parsed.email || "",
          id: toNumber(parsed.id || parsed.userId || parsed.user_id, 0)
        });
      }
    } catch (e) {
      console.error("Lỗi đọc user:", e);
    }
  }, []);

  return (
    <main className="bg-slate-50 min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-12 gap-6">

          {/* ===== SIDEBAR ===== */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sticky top-24">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center">
                <div
                  className="h-20 w-20 rounded-full grid place-items-center text-3xl font-semibold shadow-inner"
                  style={{ backgroundColor: `${BRAND}1A`, color: BRAND }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="mt-3 text-lg font-bold text-slate-900 text-center">
                  {user.name}
                </div>
                {/* Chỉ hiển thị Email ở đây để định danh */}
                <div className="text-xs text-slate-500 break-all text-center">
                  {user.email}
                </div>
              </div>

              {/* Nav Buttons */}
              <nav className="mt-8 space-y-2">
                <NavBtn
                  active={tab === "account"}
                  onClick={() => setTab("account")}
                  icon={<User size={18} />}
                  label="Tài khoản"
                />
                <NavBtn
                  active={tab === "subscription"}
                  onClick={() => setTab("subscription")}
                  icon={<CreditCard size={18} />}
                  label="Gói dịch vụ & Thanh toán"
                />

                {authUser?.role === "ADMIN" && (
                  <NavBtn
                    active={false}
                    onClick={() => window.location.href = "/admin"}
                    icon={<LayoutDashboard size={18} />}
                    label="Trang quản trị"
                  />
                )}
              </nav>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <section className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden min-h-[500px]">
              {/* Header Title */}
              <div className="px-6 py-5 border-b border-slate-200 bg-white">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {tab === "account" && "Thông tin tài khoản"}
                  {tab === "subscription" && "Quản lý Gói cước & Thanh toán"}
                  {tab === "alerts" && "Cài đặt Thông báo"}
                  {tab === "history" && "Lịch sử hoạt động"}
                </h1>
              </div>

              {/* Body */}
              <div className="p-6">
                {tab === "account" && <AccountPanel user={user} />}
                {tab === "subscription" && <SubscriptionPanel userId={user.id} />}
                {tab === "alerts" && <AlertsPanel />}
                {tab === "history" && <HistoryPanel />}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =================== UI COMPONENTS =================== */

function NavBtn({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all flex items-center gap-3 ${active
        ? "text-white shadow-md transform scale-[1.02]"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      style={active ? { backgroundColor: BRAND } : undefined}
    >
      {icon}
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-l-4 pl-3" style={{ borderColor: BRAND }}>
        {title}
      </h3>
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        {children}
      </div>
    </div>
  );
}

/* =================== PANELS =================== */

// 1. Account Panel (Chỉ giữ lại Email & Checkbox tin tức)
function AccountPanel({ user }: { user: any }) {
  const [newsletter, setNewsletter] = useState(true);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Section title="Thông tin đăng nhập">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
          <div className="text-base font-medium text-slate-900 bg-white px-4 py-2.5 rounded-lg border border-slate-200">
            {user.email}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            * Email này được sử dụng để đăng nhập và nhận vé điện tử.
          </p>
        </div>
      </Section>

      <Section title="Tùy chọn Email">
        <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-cyan-600 checked:bg-cyan-600"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
            />
            <div className="pointer-events-none absolute top-2/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
              <CheckCircle2 size={12} strokeWidth={4} />
            </div>
          </div>
          <span className="text-sm text-slate-700">
            Nhận thông tin khuyến mãi, ưu đãi đặc biệt và tin tức du lịch mới nhất từ VivuPlan.
          </span>
        </label>
      </Section>
    </div>
  );
}

// 2. Subscription & Payment Panel
function SubscriptionPanel({ userId }: { userId: number }) {
  const [subData, setSubData] = useState<SubscriptionResult | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const subRes = await fetch(`${API_URL}/subscriptions/status?userId=${userId}`);
        const subText = await subRes.text();
        const subJson = parseJsonSafe(subText);

        const payRes = await fetch(`${API_URL}/payments/history?userId=${userId}&page=0&size=10`);
        const payText = await payRes.text();
        const payJson = parseJsonSafe(payText);

        const normalizedSub = normalizeSubscriptionResult(subJson);
        if (subRes.ok || isResponseSuccess(subJson)) setSubData(normalizedSub);
        else setSubData(null);

        const normalizedPayments = normalizePaymentList(payJson);
        if (payRes.ok || isResponseSuccess(payJson)) setPayments(normalizedPayments);
        else setPayments([]);

      } catch (error) {
        console.error("Lỗi tải dữ liệu thanh toán:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-2" style={{ color: BRAND }} />
        <p className="text-sm font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const isActiveSubscription =
    Boolean(subData?.status && String(subData.status).toUpperCase() === "ACTIVE");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

      {/* 1. Trạng thái Gói cước */}
      <Section title="Gói dịch vụ hiện tại">
        {!subData || !isActiveSubscription ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-slate-900 font-bold mb-1">Chưa đăng ký gói nào</h4>
            <p className="text-sm text-slate-500 mb-4">Nâng cấp lên Premium để mở khóa tính năng AI.</p>
            <button
              className="text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
              style={{ backgroundColor: BRAND }}
              onClick={() => window.location.href = "/#pricing"}
            >
              Xem các gói cước
            </button>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard size={100} color={BRAND} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle2 size={12} /> ĐANG HOẠT ĐỘNG
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Ngày đăng ký: {formatDate(subData.startDate || "")}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-1">{subData.planName || "Gói dịch vụ"}</h3>
              <p className="text-sm text-slate-500 mb-6">
                Hết hạn vào: <strong className="text-slate-800">{formatDate(subData.endDate || "")}</strong>
              </p>

              <div className="flex gap-3">
                <button
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => window.location.href = "/#pricing"}
                >
                  Gia hạn ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* 2. Lịch sử thanh toán */}
      <Section title="Lịch sử giao dịch">
        {payments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">Chưa có giao dịch nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 font-semibold text-slate-500">Mã GD</th>
                  <th className="pb-3 font-semibold text-slate-500">Nội dung</th>
                  <th className="pb-3 font-semibold text-slate-500">Ngày</th>
                  <th className="pb-3 font-semibold text-slate-500">Số tiền</th>
                  <th className="pb-3 font-semibold text-slate-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-mono text-xs text-slate-500">{p.transactionId}</td>
                    <td className="py-4 font-medium text-slate-900">{p.description}</td>
                    <td className="py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td className="py-4 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${p.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                        p.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

// 3. Alerts Panel
function AlertsPanel() {
  return (
    <Section title="Cài đặt thông báo">
      <div className="text-center py-10">
        <div className="inline-block p-4 rounded-full bg-slate-100 text-slate-400 mb-4">
          <Bell size={32} />
        </div>
        <p className="text-slate-600 text-sm mb-4">
          Bạn chưa bật thông báo giá nào. Hãy tìm chuyến bay và bật theo dõi để nhận email khi giá giảm.
        </p>
        <button
          className="px-5 py-2 rounded-lg text-white text-sm font-bold shadow-sm hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          Tạo thông báo mới
        </button>
      </div>
    </Section>
  );
}

// 4. History Panel
function HistoryPanel() {
  return (
    <Section title="Lịch sử tìm kiếm">
      <div className="text-center py-10">
        <div className="inline-block p-4 rounded-full bg-slate-100 text-slate-400 mb-4">
          <Clock size={32} />
        </div>
        <p className="text-slate-600 text-sm mb-4">
          Chưa có lịch sử tìm kiếm gần đây.
        </p>
        <button
          className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50"
        >
          Khám phá ngay
        </button>
      </div>
    </Section>
  );
}