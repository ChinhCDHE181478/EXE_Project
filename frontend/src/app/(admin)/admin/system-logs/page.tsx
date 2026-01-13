"use client";
import { useMemo, useState } from "react";

/* Pagination: copy cùng style */
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

export default function SystemLogsPage() {
  /* mock 41 log entries */
  const allRows = useMemo(() => {
    const seeds = [
      { level: "info", msg: "Redirect /flights → provider", meta: "click_id=ab12" },
      { level: "warn", msg: "Rate limit near quota", meta: "provider=Klook" },
      { level: "error", msg: "Provider 500", meta: "route=/hotels/search" },
      { level: "info", msg: "Auth ok", meta: "user=system" },
    ] as const;

    return Array.from({ length: 41 }, (_, i) => {
      const s = seeds[i % seeds.length] as any;
      const hh = 12 + Math.floor(i / 12);
      const mm = String((20 + i) % 60).padStart(2, "0");
      const ss = String((3 * i) % 60).padStart(2, "0");
      return { ts: `2025-11-05 ${hh}:${mm}:${ss}`, ...s };
    });
  }, []);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const rows = allRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 py-4">System Logs</h1>

      <div className="flex flex-wrap gap-2">
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Search message/meta..." />
        <select className="rounded-lg border px-3 py-2 text-sm">
          <option>All levels</option>
          <option>info</option>
          <option>warn</option>
          <option>error</option>
        </select>
        <button className="px-3 py-2 rounded-lg bg-[#0a6c86] text-white text-sm">Filter</button>
        <button className="px-3 py-2 rounded-lg border text-sm">Export CSV</button>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-3 text-left w-48">Timestamp</th>
              <th className="p-3 text-left w-24">Level</th>
              <th className="p-3 text-left">Message</th>
              <th className="p-3 text-left">Meta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-mono text-xs">{r.ts}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      r.level === "error"
                        ? "bg-rose-100 text-rose-700"
                        : r.level === "warn"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {r.level}
                  </span>
                </td>
                <td className="p-3">{r.msg}</td>
                <td className="p-3 text-xs text-slate-600">{r.meta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={allRows.length} pageSize={pageSize} onChange={setPage} />
    </section>
  );
}
