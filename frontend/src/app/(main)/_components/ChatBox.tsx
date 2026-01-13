"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "ai" | "user"; content: string };

export default function ChatBox() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", content: "Xin chào! Bạn muốn đi đâu và ngân sách dự kiến là bao nhiêu?" },
  ]);

  const goChatbox = () => {
    router.push("/chatbox"); // => http://localhost:3000/chatbox
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;

    // optional: update UI preview
    setMessages((m) => [...m, { role: "user", content: t }]);
    setText("");

    // draft để trang /chatbox đọc và auto gửi (nếu bạn có xử lý)
    sessionStorage.setItem("vivu_draft", t);

    // chuyển trang
    goChatbox();
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
      {/* background: chặn click để không đè lên button */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage:
            'url("https://m.yodycdn.com/blog/hinh-nen-thien-nhien-4k-yody-vn-11.jpg")',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/40 supports-[backdrop-filter]:backdrop-blur-[0.5px] pointer-events-none" />

      {/* Logo: CLICK -> /chatbox */}
      <button
        type="button"
        onClick={goChatbox}
        className="absolute left-4 top-4 z-10 text-left"
      >
        <div className="flex items-center gap-3 rounded-xl bg-white/90 px-3.5 py-2.5 ring-1 ring-black/5 shadow">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#0891b2] text-white font-bold">
            V
          </span>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">VivuPlan</div>
            <div className="text-xs text-slate-600">Trợ lý Vivu</div>
          </div>
        </div>
      </button>

      <div className="relative">
        <div className="p-5 mt-6 pt-16 max-h-[55vh] min-h-[260px] overflow-auto space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
              <div
                className={`rounded-xl px-4 py-2.5 max-w-[75%] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#0891b2] text-white"
                    : "bg-white/90 ring-1 ring-black/5"
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
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            type="button"
            onClick={send}
            className="px-5 py-3 rounded-lg bg-[#0891b2] text-white font-medium hover:brightness-110"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
