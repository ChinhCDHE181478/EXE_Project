"use client";
import { useMemo, useState } from "react";

/* ======= nhỏ gọn: Pagination component dùng chung ======= */
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

export default function AccountsPage() {
  /* mock 32 users để thấy phân trang 10 items/trang */
  const base = [
    { name: "Nguyễn Minh Lam", email: "lam.nguyen@example.com", role: "admin", status: "active" },
    { name: "Trần Ngọc Trâm", email: "tram.tn@example.com", role: "analyst", status: "active" },
    { name: "Lê Minh Đức", email: "duc.le@example.com", role: "support", status: "disabled" },
    { name: "Đỗ Phương Thảo", email: "thao.dp@example.com", role: "owner", status: "active" },
  ] as const;

  const allUsers = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => {
        const b = base[i % base.length] as any;
        return { id: `u_${String(i + 1).padStart(3, "0")}`, ...b };
      }),
    []
  );

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageRows = allUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 py-4">Account Management</h1>

      <div className="flex flex-wrap gap-2">
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Search user..." />
        <select className="rounded-lg border px-3 py-2 text-sm">
          <option>All roles</option>
          <option>owner</option>
          <option>admin</option>
          <option>analyst</option>
          <option>support</option>
        </select>
        <button className="px-3 py-2 rounded-lg bg-[#0a6c86] text-white text-sm">Invite user</button>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left w-32">Role</th>
              <th className="p-3 text-left w-28">Status</th>
              <th className="p-3 text-left w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select defaultValue={u.role} className="rounded-md border px-2 py-1 text-xs">
                    <option>owner</option>
                    <option>admin</option>
                    <option>analyst</option>
                    <option>support</option>
                  </select>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="px-2.5 py-1.5 rounded border text-xs">Reset password</button>
                    <button className="px-2.5 py-1.5 rounded bg-[#0a6c86] text-white text-xs">
                      {u.status === "active" ? "Disable" : "Enable"}
                    </button>
                    <button className="px-2.5 py-1.5 rounded border text-xs">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={allUsers.length} pageSize={pageSize} onChange={setPage} />
    </section>
  );
}
