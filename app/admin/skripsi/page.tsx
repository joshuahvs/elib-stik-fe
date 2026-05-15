"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import { fetchSkripsiAdminList, type SkripsiRow } from "@/app/lib/skripsi";

const PER_PAGE = 10;

type StatusUi = "Pending" | "Disetujui" | "Ditolak" | "Dibatalkan" | "-";

function toUiStatus(raw: unknown): StatusUi {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  if (s === "DIBATALKAN") return "Dibatalkan";
  return "-";
}

function statusPill(status: StatusUi) {
  const className =
    status === "Pending"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : status === "Disetujui"
        ? "bg-emerald-600 text-white"
        : status === "Ditolak"
          ? "bg-rose-50 text-rose-700 border border-rose-200"
          : status === "Dibatalkan"
            ? "bg-slate-100 text-slate-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        className,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function formatDateOnly(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function getAuthorName(row: SkripsiRow) {
  const user = row.users ?? row.user;
  const name = String(user?.nama_lengkap ?? "").trim();
  if (name) return name;
  const username = String(user?.username ?? "").trim();
  if (username) return username;
  return "-";
}

export default function AdminSkripsiPage() {
  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<SkripsiRow[]>([]);
  const [error, setError] = useState<unknown>(null);

  const [status, setStatus] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      setMeLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMe() {
      setMeLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
          cache: "no-store",
        });

        if (!res.ok) {
          window.localStorage.removeItem("token");
          if (!cancelled) setIsAdmin(false);
          return;
        }

        const data = await res.json().catch(() => null);
        const role = data?.role ?? data?.user?.role ?? data?.data?.role;
        if (!cancelled) setIsAdmin(role === "admin");
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadList(
    currentPage = page,
    currentStatus = status,
    currentKeyword = keyword,
  ) {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchSkripsiAdminList({
        token,
        page: currentPage,
        limit: PER_PAGE,
        status: currentStatus || undefined,
        q: currentKeyword || undefined,
      });
      setRows(res.items);
      setTotalPages(res.totalPages);
    } catch (e) {
      setRows([]);
      setTotalPages(1);
      setError(getErrorMessage(e, "Gagal mengambil daftar skripsi"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (meLoading || !token || !isAdmin) return;
    loadList();
  }, [meLoading, token, isAdmin, page, status, keyword]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  }

  const empty = !isLoading && rows.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!meLoading && !token ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Kelola Pengajuan Skripsi
            </h1>
            <p className="mt-2 text-slate-600">Kamu belum login.</p>
            <div className="mt-6">
              <Link href="/auth/login" className="text-slate-900 underline">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {!meLoading && token && !isAdmin ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Kelola Pengajuan Skripsi
            </h1>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Kelola &amp; Verifikasi Pengajuan Skripsi
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Tinjau, filter, dan verifikasi pengajuan skripsi mahasiswa
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]"
            >
              <div className="relative">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari judul atau nama penulis..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                />
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="DISETUJUI">Disetujui</option>
                <option value="DITOLAK">Ditolak</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
              <button
                type="submit"
                className="h-11 rounded-xl bg-[#6b3a22] px-6 text-sm font-semibold text-white shadow hover:opacity-95"
              >
                Cari
              </button>
            </form>

            <ErrorMessage error={error} className="mb-4" />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 gap-3 bg-[#6b3a22] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white sm:grid-cols-[60px_1.3fr_220px_100px_160px_120px_140px]">
                <div>No.</div>
                <div>Judul Skripsi</div>
                <div>Penulis</div>
                <div>Tahun</div>
                <div>Tanggal Pengajuan</div>
                <div>Status</div>
                <div className="text-center">Aksi</div>
              </div>

              {isLoading ? (
                <div className="p-6">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              ) : empty ? (
                <div className="p-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Tidak ada pengajuan skripsi.
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Coba ubah filter atau kata kunci.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {rows.map((row, idx) => {
                    const statusUi = toUiStatus(row.status);
                    return (
                      <div
                        key={row.id}
                        className="grid grid-cols-1 gap-3 px-5 py-4 text-sm sm:grid-cols-[60px_1.3fr_220px_100px_160px_120px_140px] sm:items-center"
                      >
                        <div className="text-slate-500">
                          {(page - 1) * PER_PAGE + idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {row.judul ?? "(Tanpa judul)"}
                          </div>
                        </div>
                        <div className="text-slate-700">
                          {getAuthorName(row)}
                        </div>
                        <div className="text-slate-700">{row.tahun ?? "-"}</div>
                        <div className="text-slate-700">
                          {formatDateOnly(row.created_at)}
                        </div>
                        <div>{statusPill(statusUi)}</div>
                        <div className="flex justify-center">
                          <Link
                            href={`/admin/skripsi/${encodeURIComponent(row.id)}`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Lihat Detail
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-slate-500">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Selanjutnya
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
