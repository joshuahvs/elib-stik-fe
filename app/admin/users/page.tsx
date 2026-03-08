"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import PrimaryButton from "@/app/components/PrimaryButton";
import Link from "next/link";
import {
  fetchAdminUsers,
  type AdminUserRow,
  type UserStatus,
  type UserRole,
} from "@/app/lib/adminUsers";

function formatWIB(iso: string) {
  const d = new Date(iso);

  const day = String(
    Number(
      new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit" }).format(d)
    )
  ).padStart(2, "0");

  const month = String(
    Number(
      new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "2-digit" }).format(d)
    )
  ).padStart(2, "0");

  const year = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", year: "numeric" }).format(
    d
  );

  const hour = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    hour12: false,
  }).format(d);

  const minute = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    minute: "2-digit",
  }).format(d);

  return `${day}-${month}-${year} ${hour}:${minute}`;
}

function roleLabel(role: string | null) {
  if (!role) return "-";
  if (role === "mahasiswa") return "Mahasiswa";
  if (role === "dosen") return "Dosen";
  if (role === "umum") return "Umum";
  if (role === "admin") return "Admin";
  return role;
}

function statusBadge(status: string | null) {
  const s = status ?? "-";
  if (s === "Aktif") return "bg-green-100 text-green-700";
  if (s === "Nonaktif") return "bg-rose-100 text-rose-700";
  if (s === "Deleted") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminUsersPage() {
  const [token, setToken] = useState<string | null>(null);

  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filter
  const [status, setStatus] = useState<UserStatus | "">("");
  const [role, setRole] = useState<UserRole | "">("");

  // pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState<number | undefined>(undefined);

  // ambil token + cek role admin
  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);

    if (!t) {
      setMeLoading(false);
      return;
    }

    fetch("http://localhost:8080/auth/me", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((me) => {
        const r = me?.role ?? me?.user?.role ?? me?.data?.role;
        setIsAdmin(r === "admin");
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setMeLoading(false));
  }, []);

  async function load(nextPage = 1) {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchAdminUsers({
        token,
        status,
        role,
        page: nextPage,
        limit,
      });

      setRows(res.data);

      // total optional (biar TS aman)
      const t = "total" in res ? res.total : undefined;
      setTotal(t);

      setPage(nextPage);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
      setRows([]);
      setTotal(undefined);
    } finally {
      setIsLoading(false);
    }
  }

  // load awal setelah admin valid
  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, token, isAdmin]);

  const totalPages = useMemo(() => {
    if (typeof total === "number") return Math.max(1, Math.ceil(total / limit));
    return Math.max(1, Math.ceil(rows.length / limit));
  }, [total, rows.length]);

  const pageNumbers = useMemo(() => {
    const max = Math.min(totalPages, 10);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [totalPages]);

  const empty = !isLoading && rows.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {!meLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Daftar Pengguna</h1>
            <p className="mt-2 text-slate-600">Kamu belum login.</p>
            <div className="mt-6">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {!meLoading && token && !isAdmin ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Daftar Pengguna</h1>
            <p className="mt-2 text-slate-600">Halaman ini hanya bisa diakses oleh admin.</p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Daftar Pengguna</h1>
            </div>

            {/* FILTER BAR: Status + Peran */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-800 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                >
                  <option value="">Pilihan Opsi</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                  <option value="Deleted">Deleted</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-800 mb-2">Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                >
                  <option value="">Pilihan Opsi</option>
                  <option value="admin">Admin</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                  <option value="umum">Umum</option>
                </select>
              </div>

              <div className="md:col-span-1 md:justify-self-end">
                <PrimaryButton type="button" onClick={() => load(1)} className="h-11 px-8">
                  Filter
                </PrimaryButton>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            ) : null}

            {/* TABLE */}
            <div className="mt-10">
              <div className="rounded-2xl border overflow-hidden text-slate-900">
                <div className="grid grid-cols-5 bg-[#6b3a22] text-white font-semibold text-sm">
                  <div className="px-5 py-3">Terakhir Login</div>
                  <div className="px-5 py-3">E-mail</div>
                  <div className="px-5 py-3">Status</div>
                  <div className="px-5 py-3">Peran</div>
                  <div className="px-5 py-3">ID Pengguna</div>
                </div>

                {isLoading ? <div className="p-8 text-center text-slate-600">Memuat data…</div> : null}

                {empty ? (
                  <div className="p-8 text-center text-slate-600">
                    Tidak ada data pengguna pada filter ini.
                  </div>
                ) : null}

                {!isLoading && rows.length > 0 ? (
                  <div className="divide-y text-slate-900">
                    {rows.map((u) => (
                      <div key={u.id} className="grid grid-cols-5 text-sm">
                        <div className="px-5 py-4">{u.last_login_at ? formatWIB(u.last_login_at) : "-"}</div>
                        <div className="px-5 py-4">{u.email ?? "-"}</div>
                        <div className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                              u.status ?? null
                            )}`}
                          >
                            {u.status ?? "-"}
                          </span>
                        </div>
                        <div className="px-5 py-4">{roleLabel(u.role)}</div>
                        <div className="px-5 py-4">{u.id}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* PAGINATION */}
              {!isLoading && rows.length > 0 ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => load(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="w-11 h-11 rounded-full bg-[#6b3a22] text-white disabled:opacity-40"
                      aria-label="prev"
                    >
                      ‹
                    </button>

                    <div className="flex items-center gap-2">
                      {pageNumbers.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => load(p)}
                          className={`w-9 h-9 rounded-full text-sm ${
                            p === page ? "bg-[#b59a87] text-white" : "text-slate-700"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => load(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                      className="w-11 h-11 rounded-full bg-[#6b3a22] text-white disabled:opacity-40"
                      aria-label="next"
                    >
                      ›
                    </button>
                  </div>

                  {typeof total === "number" ? (
                    <p className="text-sm text-slate-600">
                      Menampilkan {Math.min(limit, total)} dari {total} data
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}