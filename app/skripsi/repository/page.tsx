"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import { fetchSkripsiRepositoryList, type SkripsiRow } from "@/app/lib/skripsi";

const PER_PAGE = 8;

function getAuthorName(row: SkripsiRow) {
  const user = row.users ?? row.user;
  const name = String(user?.nama_lengkap ?? "").trim();
  if (name) return name;
  const username = String(user?.username ?? "").trim();
  if (username) return username;
  return "-";
}

export default function SkripsiRepositoryPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [tahun, setTahun] = useState("");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<SkripsiRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<unknown>(null);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearError = useMemo(() => {
    const s = tahun.trim();
    if (!s) return null;
    if (!/^\d{4}$/.test(s)) return "Tahun harus 4 digit (YYYY)";
    const n = Number(s);
    if (!Number.isFinite(n) || n < 1900) return "Tahun tidak valid";
    if (n > currentYear) return "Tahun tidak boleh lebih dari tahun ini";
    return null;
  }, [tahun, currentYear]);

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent("/skripsi/repository")}`,
      );
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
          if (!cancelled) setIsAllowed(false);
          return;
        }

        const data = await res.json().catch(() => null);
        const role = data?.role ?? data?.user?.role ?? data?.data?.role;
        const allowed = ["admin", "dosen", "mahasiswa"].includes(role ?? "");
        if (!cancelled) setIsAllowed(allowed);
      } catch {
        if (!cancelled) setIsAllowed(false);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function loadList() {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchSkripsiRepositoryList({
        token,
        page,
        limit: PER_PAGE,
        q: keyword || undefined,
        tahun: !yearError && tahun.trim() ? tahun.trim() : undefined,
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
    if (meLoading || !token || !isAllowed) return;
    loadList();
  }, [meLoading, token, isAllowed, page, keyword, tahun]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  }

  const empty = !isLoading && rows.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-[#6b3a22] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight">
            Repositori Skripsi
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Cari dan akses skripsi yang sudah disetujui
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari judul atau penulis..."
                className="h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/50 focus:bg-white/20"
              />
            </div>
            <div className="w-full sm:w-44">
              <input
                type="text"
                value={tahun}
                onChange={(e) => {
                  setTahun(e.target.value);
                  setPage(1);
                }}
                placeholder="Tahun (YYYY)"
                inputMode="numeric"
                maxLength={4}
                className="h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/50 focus:bg-white/20"
              />
              {yearError ? (
                <p className="mt-1 text-xs text-rose-200">{yearError}</p>
              ) : null}
            </div>
            <button
              type="submit"
              className="h-11 rounded-lg bg-white px-6 text-sm font-semibold text-[#6b3a22]"
            >
              Cari
            </button>
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!meLoading && token && !isAllowed ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Repositori Skripsi
            </h2>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya untuk admin, dosen, dan mahasiswa.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAllowed ? (
          <>
            <ErrorMessage error={error} className="mb-4" />

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              </div>
            ) : empty ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500">
                <p className="text-base font-semibold">
                  Skripsi tidak ditemukan
                </p>
                <p className="mt-2 text-sm">
                  Coba ubah kata kunci atau filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {row.judul ?? "(Tanpa judul)"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {getAuthorName(row)}
                          {row.tahun ? ` | ${row.tahun}` : ""}
                        </p>
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                          {row.abstrak ?? "-"}
                        </p>
                      </div>
                      <div className="flex shrink-0">
                        <Link
                          href={`/skripsi/repository/${encodeURIComponent(row.id)}`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
