"use client";

import { useState } from "react";

export type UiHotel = {
  id: string;
  name: string;
  city: string;
  priceText?: string;
  rating10?: number;
  reviews?: number;
  img: string;
  linkId: string;
};

function InlineChat() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<{ role: "ai" | "user"; content: string }[]>([
    { role: "ai", content: "“Gợi ý lịch trình 2N1Đ ở Hà Nội, gần trung tâm, ngân sách 2.5tr/đêm…”" },
  ]);

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setText("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", content: "Mình sẽ đề xuất vài phương án lưu trú phù hợp ngay bên dưới nha!" }]);
    }, 400);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("https://m.yodycdn.com/blog/hinh-nen-thien-nhien-4k-yody-vn-11.jpg")' }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/40 supports-[backdrop-filter]:backdrop-blur-[0.5px]" />

      <div className="absolute left-4 top-4 z-10">
        <div className="flex items-center gap-3 rounded-xl bg-white/90 supports-[backdrop-filter]:backdrop-blur-[2px] px-3.5 py-2.5 ring-1 ring-black/5 shadow">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0891b2] text-white font-bold">
            V
          </span>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">VivuPlan</div>
            <div className="text-xs text-slate-600">Trợ lý Vivu</div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="p-5 mt-6 pt-16 max-h-[55vh] min-h-[260px] overflow-auto space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
              <div
                className={`rounded-xl px-4 py-2.5 max-w-[75%] leading-relaxed ${
                  m.role === "user" ? "bg-[#0891b2] text-white" : "bg-white/90 ring-1 ring-black/5"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 p-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập câu hỏi…"
            className="flex-1 bg-white/90 rounded-lg px-3 py-3 outline-none border border-slate-300"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} className="px-5 py-3 rounded-lg bg-[#0891b2] text-white font-medium">
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPane({
  loading,
  error,
  total,
  items,
  onOpenDeal,
}: {
  loading: boolean;
  error: string;
  total?: number;
  items: UiHotel[];
  onOpenDeal: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="bg-slate-100 ring-1 ring-black/5 shadow-sm">
        <div className="px-4 py-3 text-sm text-slate-700">
          Bao gồm tất cả các loại thuế và phí |{" "}
          {typeof total === "number" ? new Intl.NumberFormat("vi-VN").format(total) : "—"} kết quả
        </div>
      </div>

      <div className="bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex flex-wrap gap-6 px-4 pt-3">
          {["Khuyến nghị", "Đánh giá hàng đầu", "Giá thấp nhất", "Nhiều sao nhất", "Gần nhất trước"].map((t, i) => (
            <button
              key={t}
              className={`pb-2 text-sm ${
                i === 0 ? "text-sky-700 border-b-2 border-sky-600" : "text-slate-700 hover:text-sky-700"
              }`}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
        <div className="px-4 pb-3">
          <div className="rounded-md bg-sky-50 text-slate-700 text-sm px-3 py-2 shadow-sm">
            Chúng tôi tìm thông tin giá từ mọi nguồn trên mạng – số tiền các nhà cung cấp chi trả cho chúng tôi quyết định
            thứ tự sắp xếp kết quả tìm kiếm.
          </div>
        </div>
      </div>

      <InlineChat />

      {loading && <div className="text-slate-600 px-1">Đang tải kết quả…</div>}
      {!loading && error && <div className="text-rose-600 px-1">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {items.map((h) => (
            <article key={h.id} className="bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
              <div className="grid sm:grid-cols-[220px_1fr]">
                <img src={h.img} alt={h.name} className="h-full w-full object-cover sm:h-44" />
                <div className="p-4">
                  <div className="text-lg font-semibold">{h.name}</div>
                  <div className="text-sm text-slate-600">
                    {h.city}
                    {typeof h.rating10 === "number" ? ` • Xuất sắc (${h.rating10}/10)` : ""}
                    {typeof h.reviews === "number" ? ` • ${h.reviews.toLocaleString("vi-VN")} đánh giá` : ""}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sky-700 font-semibold">{h.priceText ? `Từ ${h.priceText}` : "Xem giá tốt nhất"}</div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md ring-1 ring-black/10 hover:bg-slate-50"
                      onClick={() => onOpenDeal(h.linkId)}
                    >
                      Xem giá
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {items.length === 0 && <div className="text-slate-600">Không có kết quả phù hợp.</div>}
        </div>
      )}

      {/* Pagination: để sau khi backend có page/limit */}
      <div className="flex items-center justify-center gap-2 py-2 opacity-60">
        {["<", "1", "2", "3", "…", "6", ">"].map((p, idx) => (
          <button
            key={idx}
            type="button"
            className={`min-w-9 h-9 px-3 rounded-md shadow-sm ring-1 ring-black/10 ${
              p === "1" ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </section>
  );
}
