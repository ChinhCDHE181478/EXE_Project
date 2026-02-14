"use client";
import { useState } from "react";

export default function SearchFlights({ onSearch }: { onSearch?: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tripType, setTripType] = useState<"round" | "oneway">("round");

  const swap = () => {
    const a = from;
    setFrom(to);
    setTo(a);
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTripType("round")}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tripType === "round"
              ? "bg-[#0891b2] text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Khứ hồi
        </button>
        <button
          onClick={() => setTripType("oneway")}
          className={`px-3 py-1.5 rounded-full text-sm ${
            tripType === "oneway"
              ? "bg-[#0891b2] text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Một chiều
        </button>
      </div>

      <div
        className="
          grid gap-0
          md:grid-cols-[1.2fr_auto_1.2fr_1fr_1fr_1.2fr_auto]
          rounded-2xl overflow-hidden bg-white shadow-lg ring-1 ring-black/5
          divide-y md:divide-y-0 md:divide-x divide-slate-200
        "
      >
        <div className="px-4 py-3">
          <label className="text-[11px] uppercase tracking-wide text-slate-600">
            Từ
          </label>
          <input
            className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Nhập nơi đi"
          />
        </div>

        <div className="flex items-end justify-center px-3 py-3">
          <button
            onClick={swap}
            className="mb-[2px] inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 hover:bg-slate-50"
            title="Đổi chiều"
          >
            ↔
          </button>
        </div>

        <div className="px-4 py-3">
          <label className="text-[11px] uppercase tracking-wide text-slate-600">
            Đến
          </label>
          <input
            className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Nhập nơi đến"
          />
        </div>

        <div className={`px-4 py-3 ${tripType === "oneway" ? "md:col-span-2" : ""}`}>
          <label className="text-[11px] uppercase tracking-wide text-slate-600">
            Ngày đi
          </label>
          <input type="date" className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2" />
        </div>

        {tripType === "round" && (
          <div className="px-4 py-3">
            <label className="text-[11px] uppercase tracking-wide text-slate-600">
              Ngày về
            </label>
            <input type="date" className="mt-1 w-full bg-transparent outline-none border-0 px-0 py-2" />
          </div>
        )}

        <div className="px-4 py-3">
          <label className="text-[11px] uppercase tracking-wide text-slate-600">
            Ngân sách (tối đa)
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={100000}
              placeholder="2,000,000"
              className="w-full bg-transparent outline-none border-0 px-0 py-2"
            />
            <select className="rounded-lg border border-slate-300 px-2 py-2">
              <option>VND</option>
              <option>USD</option>
            </select>
          </div>
        </div>

        <div className="px-4 py-3 flex items-end justify-end">
          <button
            className="h-12 px-6 rounded-lg bg-[#0891b2] text-white font-semibold hover:brightness-110"
            onClick={onSearch ?? (() => (window.location.href = "/pages/ai"))}
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
}
