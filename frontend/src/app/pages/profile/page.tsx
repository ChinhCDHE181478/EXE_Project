// src/app/pages/profiles/page.tsx
"use client";

import { useState } from "react";

/** Sidebar item type */
type TabKey = "alerts" | "account" | "history";

/** Fake user profile (sau này thay bằng data thật từ backend / context) */
const USER = {
  name: "Nguyễn Minh Lam",
  email: "lam.nguyen@example.com",
};

const BRAND = "#0891b2"; // đồng bộ với màu chủ đạo của bạn

export default function ProfilePage() {
  const [tab, setTab] = useState<TabKey>("account");

  return (
    // ✅ IMPORTANT: đừng dùng backdrop/transform/filter/z-index ở main (dễ che dropdown header)
    <main className="bg-slate-50 min-h-[calc(100vh-140px)]">
      <div className="container mx-auto px-4 py-6 md:py-10 pb-12">
        <div className="grid grid-cols-12 gap-6">
          {/* ===== Sidebar ===== */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              {/* Avatar + name */}
              <div className="flex flex-col items-center">
                <div
                  className="h-20 w-20 rounded-full grid place-items-center text-3xl font-semibold"
                  style={{ backgroundColor: `${BRAND}1A`, color: BRAND }}
                >
                  {USER.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="mt-3 text-lg font-semibold text-slate-900">
                  Chào bạn!
                </div>
                <div className="text-xs text-slate-500 break-all">
                  {USER.email}
                </div>
              </div>

              {/* Nav */}
              <nav className="mt-6 space-y-2">
                <NavBtn
                  active={tab === "alerts"}
                  onClick={() => setTab("alerts")}
                  label="🔔 Thông báo giá"
                />
                <NavBtn
                  active={tab === "account"}
                  onClick={() => setTab("account")}
                  label="👤 Tài khoản"
                />
                <NavBtn
                  active={tab === "history"}
                  onClick={() => setTab("history")}
                  label="🕘 Xem lịch sử"
                />

                {/* ✅ Bỏ nút Đăng xuất (đã có trong dropdown Header) */}
              </nav>
            </div>
          </aside>

          {/* ===== Content ===== */}
          <section className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {/* Header Title */}
              <div className="px-5 py-4 border-b border-slate-200">
                <div className="text-sm text-slate-500">« Tài khoản của bạn</div>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  {tab === "account"
                    ? "Tài khoản"
                    : tab === "alerts"
                    ? "Thông báo giá"
                    : "Lịch sử"}
                </h1>
              </div>

              {/* Body */}
              <div className="p-5 md:p-6 space-y-6">
                {tab === "account" && <AccountPanel />}
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

/* =================== UI bits =================== */

function NavBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
        active
          ? "border-transparent text-white"
          : "border-slate-200 text-slate-800 hover:bg-slate-50"
      }`}
      style={
        active
          ? { backgroundColor: BRAND }
          : undefined
      }
      type="button"
    >
      {label}
    </button>
  );
}

function Row({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <div className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* =================== Panels =================== */

/** Panel: Tài khoản */
function AccountPanel() {
  const [newsletter, setNewsletter] = useState(false);
  const [airports, setAirports] = useState<string[]>([]);

  const addAirport = () => {
    const v = prompt("Nhập sân bay ưu tiên (ví dụ: HAN, SGN, BKK)");
    if (v && v.trim()) setAirports((s) => [...s, v.toUpperCase().trim()]);
  };

  return (
    <>
      <Row title="Thông tin chung">
        <div className="grid gap-3 md:grid-cols-[200px_1fr] items-center">
          <div className="text-sm text-slate-600">Email</div>
          <div className="text-sm font-medium text-slate-900 break-all">
            {USER.email}
          </div>

          <div className="text-sm text-slate-600">Tên</div>
          <div className="text-sm font-medium text-slate-900">{USER.name}</div>
        </div>
      </Row>

      <Row title="Đăng ký">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5"
            style={{ accentColor: BRAND }}
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          <span>
            Tôi muốn các ưu đãi, tin tức và bài viết truyền cảm hứng mới nhất về
            du lịch được gửi thẳng vào email của tôi.
          </span>
        </label>
      </Row>

      <Row title="Sân bay khởi hành ưu tiên">
        <p className="text-sm text-slate-600">
          Thêm sân bay ưa thích của bạn để chúng tôi gợi ý các ưu đãi phù hợp.
        </p>

        <div className="mt-3">
          <button
            onClick={addAirport}
            type="button"
            className="rounded-lg text-white text-sm px-4 py-2 hover:brightness-110"
            style={{ backgroundColor: BRAND }}
          >
            Thêm sân bay
          </button>
        </div>

        {airports.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {airports.map((a, i) => (
              <li
                key={`${a}-${i}`}
                className="px-2.5 py-1 text-xs rounded-md font-medium"
                style={{ backgroundColor: `${BRAND}1A`, color: BRAND }}
              >
                {a}
              </li>
            ))}
          </ul>
        )}
      </Row>

      <Row title="Cài đặt tài khoản">
        <div className="text-sm text-slate-600">
          (Mock UI) Sau này bạn có thể thêm: đổi mật khẩu, ngôn ngữ, tiền tệ,
          xoá tài khoản…
        </div>
      </Row>
    </>
  );
}

/** Panel: Thông báo giá (mock) */
function AlertsPanel() {
  return (
    <div className="text-sm text-slate-700">
      Bạn chưa bật thông báo giá nào. Hãy tìm chuyến bay và bật theo tuyến bạn
      quan tâm để nhận email khi giá thay đổi.
      <div className="mt-3">
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          style={{ borderColor: BRAND, color: BRAND }}
        >
          Tạo thông báo giá mới
        </button>
      </div>
    </div>
  );
}

/** Panel: Lịch sử (mock) */
function HistoryPanel() {
  return (
    <div className="text-sm text-slate-700">
      Chưa có lịch sử tìm kiếm gần đây.
      <div className="mt-3">
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          style={{ borderColor: BRAND, color: BRAND }}
        >
          Khám phá chuyến bay
        </button>
      </div>
    </div>
  );
}
