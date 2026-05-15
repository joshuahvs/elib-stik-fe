"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import {
  fetchArchivedBooks,
  retrieveArchivedBook,
  type ArchivedBookRow,
} from "@/app/lib/adminBooks";
import { fetchMe } from "@/app/lib/me";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

function cleanText(value?: string | number | null) {
  if (value == null) return "-";
  const s = String(value).replace(/[\[\]'"]/g, "").trim();
  return s || "-";
}

export default function ArchivedBooksPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingMe, setCheckingMe] = useState(true);

  const [rows, setRows] = useState<ArchivedBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  const [selectedBook, setSelectedBook] = useState<ArchivedBookRow | null>(null);
  const [retrieving, setRetrieving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
    }, []);

  const limit = 10;

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent("/admin/books/archive")}`,
      );
      setCheckingMe(false);
      return;
    }

    let cancelled = false;

    fetchMe(t)
      .then((me) => {
        if (!cancelled) {
          setIsAdmin(String(me.role).toLowerCase() === "admin");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAdmin(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingMe(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function loadArchive(currentPage = page) {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
        const res = await fetchArchivedBooks({
        token,
        page: currentPage,
        limit,
        q: keyword,
        category,
        from: fromDate,
        to: toDate,
        });

        setRows(res.data ?? []);
        setCategories(res.categories ?? []);
        setTotalPages(res.meta?.total_pages ?? 1);
        setTotalData(res.meta?.total_data ?? 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
        if (!token || checkingMe || !isAdmin) return;
        loadArchive(page);
    }, [token, checkingMe, isAdmin, page]);

  const showingText = useMemo(() => {
        if (totalData === 0) return "Tidak ada buku diarsipkan.";
        return `Menampilkan ${rows.length} dari ${totalData} data`;
    }, [rows.length, totalData]);

  async function handleRetrieve() {
    if (!token || !selectedBook) return;

    setRetrieving(true);
    setError(null);
    setSuccess(null);

    try {
      await retrieveArchivedBook({
        token,
        id: selectedBook.id,
      });

      setSuccess("Buku berhasil dikembalikan.");
      setSelectedBook(null);

      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadArchive(nextPage);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal mengembalikan buku."));
    } finally {
      setRetrieving(false);
    }
  }

  if (checkingMe) {
    return (
      <main className="min-h-screen bg-slate-50 px-8 py-10">
        <p className="text-sm text-slate-500">Memuat halaman arsip buku...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 px-8 py-10">
        <ErrorMessage error="Halaman ini hanya dapat diakses oleh admin." />
      </main>
    );
  }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();

        if (fromDate && toDate && fromDate > toDate) {
            setError("Tanggal mulai tidak boleh melebihi tanggal akhir.");
            return;
        }

        setPage(1);
        loadArchive(1);
        }

        function handleReset() {
        setKeyword("");
        setCategory("");
        setFromDate("");
        setToDate("");
        setPage(1);

        setTimeout(() => {
            loadArchive(1);
        }, 0);
    }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Arsip Buku (Buku Terhapus)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola buku yang telah dihapus. Buku dapat dikembalikan ke
            koleksi aktif jika diperlukan.
          </p>
        </div>

        <ErrorMessage error={error} className="mb-5" />

        {success ? (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        ) : null}

        <form
            onSubmit={handleSearch}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Cari Buku
                </label>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Cari judul, penulis, kategori, tahun..."
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#6b3a22] focus:ring-2 focus:ring-[#6b3a22]/20"
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Kategori
                </label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#6b3a22] focus:ring-2 focus:ring-[#6b3a22]/20"
                >
                    <option value="">Semua Kategori</option>
                    {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                    ))}
                </select>
                </div>

                <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Dari Tanggal
                </label>
                <input
                    type="date"
                    value={fromDate}
                    max={today}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#6b3a22] focus:ring-2 focus:ring-[#6b3a22]/20"
                />
                </div>

                <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sampai Tanggal
                </label>
                <input
                    type="date"
                    value={toDate}
                    max={today}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-[#6b3a22] focus:ring-2 focus:ring-[#6b3a22]/20"
                />
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg bg-[#6b3a22] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5b2f1d]"
                >
                Cari
                </button>

                <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                Reset
                </button>
            </div>
        </form>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#6b3a22] text-left text-white">
                <th className="w-16 px-5 py-4 font-semibold">No</th>
                <th className="px-5 py-4 font-semibold">Judul</th>
                <th className="px-5 py-4 font-semibold">Penulis</th>
                <th className="px-5 py-4 font-semibold">Kategori</th>
                <th className="px-5 py-4 font-semibold">Tahun Terbit</th>
                <th className="px-5 py-4 font-semibold">Tanggal Dihapus</th>
                <th className="px-5 py-4 text-center font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Memuat data arsip buku...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Tidak ada buku diarsipkan.
                  </td>
                </tr>
              ) : (
                rows.map((book, index) => (
                  <tr
                    key={String(book.id)}
                    className="border-t border-slate-200 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-slate-600">
                      {(page - 1) * limit + index + 1}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {cleanText(book.judul)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {cleanText(book.nama_orang)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {cleanText(book.subjek)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {cleanText(book.tahun_terbit)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDateTime(book.archived_at)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedBook(book)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[#6b3a22] bg-[#6b3a22] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5b2f1d]"
                      >
                        Kembalikan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 text-center text-sm text-slate-500">
          {showingText}
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sebelumnya
          </button>

          <span className="text-sm text-slate-600">
            Halaman {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </section>

      {selectedBook ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M5 7l1.2 12.2A2 2 0 008.2 21h7.6a2 2 0 002-1.8L19 7"
                    />
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 3h6l1 4H8l1-4z"
                    />
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 17V11m0 0l-3 3m3-3l3 3"
                    />
                </svg>
            </div>

            <h2 className="text-base font-bold text-slate-900">
              Kembalikan Buku?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Apakah Anda yakin ingin mengembalikan buku{" "}
              <span className="font-semibold text-slate-900">
                {cleanText(selectedBook.judul)}
              </span>{" "}
              ke koleksi aktif?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleRetrieve}
                disabled={retrieving}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#6b3a22] px-4 text-sm font-semibold text-white transition hover:bg-[#5b2f1d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retrieving ? "Memproses..." : "Ya, Kembalikan"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                disabled={retrieving}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}