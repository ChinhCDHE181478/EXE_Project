"use client";
import { useMemo, useState } from "react";

/* Reuse Pagination (y hệt ở Accounts) */
function Pagination({
  page,
  total,
  pageSize = 10,
  onChange,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const nums = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const arr: (number | string)[] = [1];
    if (page > 3) arr.push("…");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    if (page < totalPages - 2) arr.push("…");
    arr.push(totalPages);
    return arr;
  })();

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        disabled={page === 1}
        onClick={() => onChange(Math.max(1, page - 1))}
      >
        ‹ Trước
      </button>
      {nums.map((n, i) =>
        typeof n === "number" ? (
          <button
            key={i}
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-md border text-sm ${
              page === n ? "bg-[#0a6c86] text-white border-[#0a6c86]" : "bg-white"
            }`}
          >
            {n}
          </button>
        ) : (
          <span key={i} className="px-2 text-slate-500">
            {n}
          </span>
        )
      )}
      <button
        className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"
        disabled={page === Math.ceil(total / pageSize)}
        onClick={() => onChange(Math.min(Math.ceil(total / pageSize), page + 1))}
      >
        Sau ›
      </button>
    </div>
  );
}

export default function ApiUsagePage() {
  const [tab, setTab] = useState<"usage" | "tokens">("usage");

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 py-4">API Usage & Token Tracking</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("usage")}
          className={`px-3 py-2 rounded-lg text-sm ${tab === "usage" ? "bg-[#0a6c86] text-white" : "bg-white border text-slate-700"}`}
        >
          API Usage
        </button>
        <button
          onClick={() => setTab("tokens")}
          className={`px-3 py-2 rounded-lg text-sm ${tab === "tokens" ? "bg-[#0a6c86] text-white" : "bg-white border text-slate-700"}`}
        >
          Token Tracking
        </button>
      </div>

      {tab === "usage" ? <UsageTable /> : <TokenTable />}
    </section>
  );
}

/* ===== Usage Table with pagination ===== */
function UsageTable() {
  const allRows = useMemo(() => {
    const seed = [
      { route: "/flights/search", status: 200, latency: 128, provider: "Skyscanner" },
      { route: "/hotels/search", status: 200, latency: 164, provider: "Booking" },
      { route: "/cars/search", status: 429, latency: 3, provider: "Klook" },
      { route: "/ai/itinerary", status: 200, latency: 412, provider: "OpenAI" },
    ];
    return Array.from({ length: 47 }, (_, i) => {
      const s = seed[i % seed.length];
      const hh = 13 + Math.floor(i / 6);
      const mm = String((10 + i) % 60).padStart(2, "0");
      return {
        time: `2025-11-05 ${hh}:${mm}`,
        ...s,
      };
    });
  }, []);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const rows = allRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Route</th>
              <th className="p-3 text-left">Provider</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Latency (ms)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{r.time}</td>
                <td className="p-3 font-mono text-xs">{r.route}</td>
                <td className="p-3">{r.provider}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      r.status === 200 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-3">{r.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={allRows.length} pageSize={pageSize} onChange={setPage} />
    </>
  );
}

/* ===== Token Table with pagination ===== */
function TokenTable() {
  const allRows = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const providers = ["Skyscanner", "Klook", "Booking", "CJ Affiliate"];
        const p = providers[i % providers.length];
        const status = i % 7 === 0 ? "Paused" : "Active";
        return {
          name: `${p} Key #${i + 1}`,
          lastUsed: `2025-11-05 ${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
          quota: `${(i * 317) % 10000} / 10,000`,
          status,
        };
      }),
    []
  );

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const rows = allRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-3 text-left">Token</th>
              <th className="p-3 text-left">Last used</th>
              <th className="p-3 text-left">Quota</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.lastUsed}</td>
                <td className="p-3">{r.quota}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      r.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-3">
                  <button className="px-3 py-1.5 rounded bg-[#0a6c86] text-white text-xs">Rotate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={allRows.length} pageSize={pageSize} onChange={setPage} />
    </>
  );
}
