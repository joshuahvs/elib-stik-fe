"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import PrimaryButton from "@/app/components/PrimaryButton";
import Link from "next/link";
import { fetchLoginLogs, type LoginLog, type LoginLogStatus } from "@/app/lib/adminLoginLogs";

function formatWIB(iso: string) {
  const d = new Date(iso);

  const day = String(
    Number(new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit" }).format(d))
  ).padStart(2, "0");

  const month = String(
    Number(new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "2-digit" }).format(d))
  ).padStart(2, "0");

  const year = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", year: "numeric" }).format(d);

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

export default function AdminLoginLogsPage() {
  const [token, setToken] = useState<string | null>(null);

  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filter (sesuai hifi)
  const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
  const [to, setTo] = useState<string>("");
  const [status, setStatus] = useState<LoginLogStatus | "">("");
  const [role, setRole] = useState<string>("");

  // pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState<number | undefined>(undefined);

  // 1) ambil token + cek role admin dari /auth/me
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
        const role = me?.role ?? me?.user?.role ?? me?.data?.role;
        setIsAdmin(role === "admin");
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setMeLoading(false));
  }, []);

  async function load(nextPage = 1) {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchLoginLogs({
        token,
        from,
        to,
        status,
        role,
        page: nextPage,
        limit,
      });

      setLogs(res.data);
      setTotal(res.data.length);
      setPage(nextPage);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
      setLogs([]);
      setTotal(undefined);
    } finally {
      setIsLoading(false);
    }
  }

  // 2) load awal setelah admin valid
  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, token, isAdmin]);

  const totalPages = useMemo(() => {
    if (typeof total === "number") return Math.max(1, Math.ceil(total / limit));

    return Math.max(1, Math.ceil(logs.length / limit));
  }, [total, logs.length]);

  const pageNumbers = useMemo(() => {
    const max = Math.min(totalPages, 10);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [totalPages]);

  const empty = !isLoading && logs.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Belum login */}
        {!meLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Riwayat Login</h1>
            <p className="mt-2 text-slate-600">Kamu belum login.</p>
            <div className="mt-6">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {/* Bukan admin */}
        {!meLoading && token && !isAdmin ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Riwayat Login</h1>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
        ) : null}

        {/* Admin page */}
        {!meLoading && token && isAdmin ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Riwayat Login</h1>
            </div>

            {/* FILTER BAR */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Dari Tanggal</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Sampai Tanggal</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                >
                  <option value="">Pilihan Opsi</option>
                  <option value="success">success</option>
                  <option value="failed">failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                >
                  <option value="">Pilihan Opsi</option>
                  <option value="dosen">Dosen</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="umum">Umum</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="md:justify-self-end">
                <PrimaryButton
                  type="button"
                  onClick={() => load(1)}
                  className="h-11 px-8"
                >
                  Filter
                </PrimaryButton>
              </div>
            </div>

            {/* ERROR */}
            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            ) : null}

            {/* TABLE */}
            <div className="mt-10">
              <div className="rounded-2xl border overflow-hidden text-slate-900">
                <div className="grid grid-cols-5 bg-[#6b3a22] text-white font-semibold text-sm">
                  <div className="px-5 py-3">Waktu</div>
                  <div className="px-5 py-3">Status</div>
                  <div className="px-5 py-3">E-mail</div>
                  <div className="px-5 py-3">Peran</div>
                  <div className="px-5 py-3">ID Pengguna</div>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-slate-600">Memuat data…</div>
                ) : null}

                {empty ? (
                  <div className="p-8 text-center text-slate-600">
                    Tidak ada data login pada filter ini.
                  </div>
                ) : null}

                {!isLoading && logs.length > 0 ? (
                  <div className="divide-y text-slate-900">
                    {logs.map((row) => (
                      <div key={row.id} className="grid grid-cols-5 text-sm">
                        <div className="px-5 py-4">{formatWIB(row.created_at)}</div>
                        <div className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              row.status === "success"
                                ? "bg-green-100 text-green-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                        <div className="px-5 py-4">{row.email ?? "-"}</div>
                        <div className="px-5 py-4">{roleLabel(row.role)}</div>
                        <div className="px-5 py-4">{row.user_id ?? "-"}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* PAGINATION */}
              {!isLoading && logs.length > 0 ? (
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