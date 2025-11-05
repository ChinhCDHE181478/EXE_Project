"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "ai" | "user"; content: string };
type Conv = { id: string; title: string; messages: Msg[] };

/* === Text đầu trang (đã rút gọn) === */
const HERO_TITLE = "Bạn muốn đi đâu, khi nào & ngân sách?";
const QUICK_SUGGESTS = [
  "HAN ⇄ DAD cuối tuần",
  "SGN → BKK 3N2Đ",
  "Khách sạn 4★ Đà Lạt",
];

export default function ChatboxPage() {
  const [openSidebar, setOpenSidebar] = useState(true);
  const [openTopMenu, setOpenTopMenu] = useState(false);

  const [convs, setConvs] = useState<Conv[]>([
    { id: "c1", title: "Cuộc trò chuyện 1", messages: [] },
  ]);
  const [activeId, setActiveId] = useState("c1");
  const active = convs.find((c) => c.id === activeId)!;

  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const isEmpty = active.messages.length === 0;

  const scrollToEnd = () =>
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  useEffect(() => {
    scrollToEnd();
  }, [active?.messages]);

  const send = (preFill?: string) => {
    const t = (preFill ?? text).trim();
    if (!t) return;
    setConvs((arr) =>
      arr.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { role: "user", content: t }] }
          : c
      )
    );
    setText("");
    setTimeout(() => {
      setConvs((arr) =>
        arr.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    role: "ai",
                    content:
                      "Mình sẽ tìm vé, phòng & xe phù hợp nhất theo tiêu chí của bạn. (Demo)",
                  },
                ],
              }
            : c
        )
      );
    }, 420);
  };

  const newChat = () => {
    const id = crypto.randomUUID();
    const next: Conv = {
      id,
      title: `Cuộc trò chuyện ${convs.length + 1}`,
      messages: [],
    };
    setConvs((arr) => [next, ...arr]);
    setActiveId(id);
  };

  const deleteActive = () => {
    if (!active) return;
    if (!window.confirm("Xóa cuộc trò chuyện hiện tại?")) return;

    setConvs((arr) => {
      const next = arr.filter((c) => c.id !== activeId);
      if (next.length > 0) {
        setActiveId(next[0].id);
        return next;
      }
      const id = crypto.randomUUID();
      const blank: Conv = { id, title: "Cuộc trò chuyện mới", messages: [] };
      setActiveId(id);
      return [blank];
    });
  };

  return (
    <div
      className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100"
      onClick={() => setOpenTopMenu(false)}
    >
      {/* ===== Top-right ellipsis ===== */}
      <div className="fixed right-4 top-4 z-30">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenTopMenu((v) => !v);
            }}
            className="rounded-lg bg-slate-900/70 backdrop-blur ring-1 ring-white/10 shadow px-3 py-2 hover:bg-slate-800"
            title="Tùy chọn"
          >
            …
          </button>
          {openTopMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900/95 ring-1 ring-white/10 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Di chuyển sang dự án →
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Xóa khỏi Project
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Lưu trữ
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-slate-800 text-sm">
                Báo cáo cuộc trò chuyện
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button
                onClick={deleteActive}
                className="w-full text-left px-3 py-2 hover:bg-red-900/40 text-red-300 text-sm"
              >
                Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Collapsed rail (GIỮ NGUYÊN layout, đổi nút thành logo V màu xanh) ===== */}
      {!openSidebar && (
        <div className="fixed left-0 top-0 z-30 h-screen w-[56px] bg-[#070B16] border-r border-white/10 flex flex-col items-center py-3">
          <button
            onClick={() => setOpenSidebar(true)}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-md"
            title="Mở danh sách chat"
          >
            <div className="h-7 w-7 rounded-md bg-[#0891b2] text-white font-bold grid place-items-center">
              V
            </div>
          </button>
          <button
            onClick={newChat}
            className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-800"
            title="Chat mới"
          >
            ✚
          </button>
          <div className="flex-1" />
          <div className="mb-2 h-9 w-9 rounded-full bg-slate-700 grid place-items-center">
            <span className="text-slate-200 text-sm">U</span>
          </div>
        </div>
      )}

      {/* ===== Sidebar (header đã có logo V màu xanh) ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[320px] transform bg-[#070B16] backdrop-blur ring-1 ring-white/10 shadow-2xl transition-transform ${
          openSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#0891b2] text-white grid place-items-center font-bold">
            V
          </div>
          <button
            onClick={() => setOpenSidebar(false)}
            className="ml-auto rounded-md px-2 py-1 text-slate-300 hover:bg-slate-800"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-3 border-b border-white/10">
          <button
            onClick={newChat}
            className="w-full rounded-lg bg-[#0891b2] px-3 py-2 text-white font-medium hover:brightness-110"
          >
            + Chat mới
          </button>
        </div>

        <div className="p-2 space-y-1 overflow-auto h-[calc(100%-56px-60px-72px)]">
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveId(c.id);
                setOpenSidebar(false);
              }}
              className={`w-full text-left rounded-lg px-3 py-2 hover:bg-slate-800/60 ${
                c.id === activeId
                  ? "bg-sky-900/40 ring-1 ring-sky-700/40"
                  : "bg-transparent"
              }`}
            >
              <div className="text-sm font-medium line-clamp-1">{c.title}</div>
              <div className="text-xs text-slate-400 line-clamp-1">
                {c.messages.at(-1)?.content || "Chưa có tin nhắn"}
              </div>
            </button>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-700 grid place-items-center">
              <span className="text-slate-200 text-sm">U</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">user01</div>
              <div className="text-xs text-slate-400">Đang hoạt động</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== Chat area ===== */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-24 pb-32">
        {isEmpty ? (
          <div className="min-h-[60vh] grid place-items-center text-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-100">
                {HERO_TITLE}
              </h1>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {QUICK_SUGGESTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-white/15 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={listRef}
            className="max-h-[68vh] min-h-[280px] overflow-auto space-y-3 pr-1"
          >
            {active.messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : ""}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 leading-relaxed shadow-sm max-w-[78%] ${
                    m.role === "user"
                      ? "bg-[#0891b2] text-white"
                      : "bg-slate-800 text-slate-100 ring-1 ring-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Input bar ===== */}
      <div
        className={
          isEmpty
            ? "fixed left-1/2 top-[48%] z-20 -translate-x-1/2"
            : "fixed inset-x-0 bottom-0 z-20 pb-5"
        }
      >
        <div className="mx-auto w-[min(800px,calc(100vw-160px))] px-4">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-900/70 backdrop-blur ring-1 ring-white/10 shadow-lg">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập điểm đi/đến, ngày dự kiến và ngân sách…"
              className="flex-1 rounded-2xl bg-transparent px-4 py-4 outline-none placeholder:text-slate-400 text-slate-100"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={() => send()}
              className="m-1 mr-2 h-11 shrink-0 rounded-xl bg-[#0891b2] px-5 text-white font-medium hover:brightness-110"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
