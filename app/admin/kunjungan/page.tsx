"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  fetchAdminKunjungan,
  type KunjunganRow,
} from "@/app/lib/adminKunjungan";

function formatWIBParts(iso: string) {
  const d = new Date(iso);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    tanggal: `${get("day")}-${get("month")}-${get("year")}`,
    waktu: `${get("hour")}:${get("minute")}`,
  };
}

function roleLabel(role: string | null) {
  if (!role) return "-";
  if (role === "mahasiswa") return "Mahasiswa";
  if (role === "dosen") return "Dosen";
  if (role === "umum") return "Umum";
  if (role === "admin") return "Admin";
  return role;
}

export default function AdminKunjunganPage() {
  const [token, setToken] = useState<string | null>(null);

  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<KunjunganRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);

    if (!t) {
      setMeLoading(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, {
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

  async function load(nextPage = page) {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchAdminKunjungan({
        token,
        start_date: startDate,
        end_date: endDate,
        role,
        query,
        page: nextPage,
        limit,
      });

      setRows(res.data);
      setMeta(res.meta);
      setPage(res.meta.page);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
      setRows([]);
      setMeta({
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;

    load(1);
  }, [meLoading, token, isAdmin]);

  function handleFilter() {
    setPage(1);
    load(1);
  }

  function handleReset() {
    setStartDate("");
    setEndDate("");
    setRole("");
    setQuery("");
    setPage(1);

    if (!token) return;

    setTimeout(() => {
      load(1);
    }, 0);
  }

  const empty = !isLoading && rows.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!meLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat Kunjungan
            </h1>
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
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat Kunjungan
            </h1>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                Riwayat Kunjungan
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  max={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  max={today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Peran
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                >
                  <option value="">Pilihan Opsi</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                  <option value="umum">Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Nama
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                />
              </div>

              <div className="flex gap-3">
                <PrimaryButton
                  type="button"
                  onClick={handleFilter}
                  className="h-11 px-8"
                >
                  Filter
                </PrimaryButton>

                <button
                  type="button"
                  onClick={handleReset}
                  className="h-11 px-6 rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>

            {error ? <ErrorMessage error={error} className="mt-6" /> : null}

            <div className="mt-10">
              <div className="rounded-2xl border overflow-hidden text-slate-900">
                <div className="grid grid-cols-4 bg-[#6b3a22] text-white font-semibold text-sm">
                  <div className="px-5 py-3">Nama</div>
                  <div className="px-5 py-3">Peran</div>
                  <div className="px-5 py-3">Tanggal</div>
                  <div className="px-5 py-3">Waktu</div>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-slate-600">
                    Memuat data…
                  </div>
                ) : null}

                {empty ? (
                  <div className="p-8 text-center text-slate-600">
                    Tidak ada data kunjungan pada filter ini.
                  </div>
                ) : null}

                {!isLoading && rows.length > 0 ? (
                  <div className="divide-y text-slate-900">
                    {rows.map((row) => {
                      const waktu = formatWIBParts(row.tanggal_kunjungan);

                      return (
                        <div key={row.id} className="grid grid-cols-4 text-sm">
                          <div className="px-5 py-4">{row.nama ?? "-"}</div>
                          <div className="px-5 py-4">{roleLabel(row.role)}</div>
                          <div className="px-5 py-4">{waktu.tanggal}</div>
                          <div className="px-5 py-4">{waktu.waktu}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {!isLoading && rows.length > 0 ? (
                <>
                  <div className="mt-6 text-center text-sm text-slate-600">
                    Menampilkan {rows.length} dari {meta.total} data
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => load(page - 1)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>

                    <span className="text-sm text-slate-600">
                      Halaman {meta.page} / {meta.totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={page >= meta.totalPages}
                      onClick={() => load(page + 1)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Berikutnya
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}