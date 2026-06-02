"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchKoleksi, type BukuRow } from "@/app/lib/koleksi";
import KoleksiFilter from "./components/KoleksiFilter";

const PER_PAGE = 12;

// Strips stringified array artifacts like ['Value'] or ["Value"]
const cleanText = (text: string | null): string => {
  if (!text) return "";
  return text.replace(/[\[\]'\"]/g, "").trim();
};

const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' fill='%23f1f5f9'%3E%3Crect width='400' height='533'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='48' font-weight='700' dy='.3em'%3EImage Not%3C/text%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='48' font-weight='700' dy='.3em'%3EAvailable%3C/text%3E%3C/svg%3E";

export default function KoleksiPageClient() {
  const searchParams = useSearchParams();
  const keywordParam = (
    searchParams.get("q") ??
    searchParams.get("keyword") ??
    ""
  ).trim();

  const [searchInput, setSearchInput] = useState(keywordParam);
  const [keyword, setKeyword] = useState(keywordParam);
  const [rows, setRows] = useState<BukuRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalData, setTotalData] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filterKategori, setFilterKategori] = useState("");
  const [filterKetersediaan, setFilterKetersediaan] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState<string[]>([]);
  const [filterSubjeks, setFilterSubjeks] = useState<string[]>([]);

  useEffect(() => {
    setSearchInput(keywordParam);
    setKeyword(keywordParam);
    setPage(1);
  }, [keywordParam]);

  const loadData = useCallback(
    async (
      kw: string,
      pg: number,
      kategori: string,
      ketersediaan: string,
      tahun: string[],
      subjeks: string[],
    ) => {
      setIsLoading(true);
      try {
        const res = await fetchKoleksi({
          keyword: kw || undefined,
          page: pg,
          limit: PER_PAGE,
          category: kategori || undefined,
          ketersediaan: ketersediaan !== "Semua" ? ketersediaan : undefined,
          tahun: tahun.length > 0 ? tahun : undefined,
          subjek: subjeks.length > 0 ? subjeks : undefined,
        });
        setRows(res.data);
        setTotalPages(res.meta.total_pages);
        setTotalData(res.meta.total_data);
      } catch {
        setRows([]);
        setTotalPages(0);
        setTotalData(0);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData(
      keyword,
      page,
      filterKategori,
      filterKetersediaan,
      filterTahun,
      filterSubjeks,
    );
  }, [
    keyword,
    page,
    filterKategori,
    filterKetersediaan,
    filterTahun,
    filterSubjeks,
    loadData,
  ]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  }

  function handleCategoryChange(category: string) {
    setFilterKategori(category);
    setPage(1);
  }

  function handleSubjekChange(subjek: string) {
    // Toggle subjek selection (add or remove)
    setFilterSubjeks((prev) => {
      if (prev.includes(subjek)) {
        return prev.filter((s) => s !== subjek);
      } else {
        return [...prev, subjek];
      }
    });
    setPage(1);
  }

  function handleTahunChange(tahun: string) {
    // Toggle tahun selection (add or remove)
    setFilterTahun((prev) => {
      if (prev.includes(tahun)) {
        return prev.filter((t) => t !== tahun);
      } else {
        return [...prev, tahun];
      }
    });
    setPage(1);
  }

  function handleResetFilters() {
    setFilterKategori("");
    setFilterKetersediaan("Semua");
    setFilterTahun([]);
    setFilterSubjeks([]);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#4A2612] via-[#6B3A22] to-[#8A4D2E] text-white">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top_left,rgba(245,158,11,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-black/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-14">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <div className="flex items-center gap-4">
                {/* Police insignia */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/d/dd/Insignia_of_the_Indonesian_National_Police.svg"
                  alt="Logo POLRI"
                  className="h-14 w-14"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                    E-Library STIK
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                    Koleksi Perpustakaan
                  </h1>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/75">
                Temukan buku, jurnal, dan referensi ilmiah yang Anda butuhkan
                untuk riset, kuliah, dan pengembangan ilmu pengetahuan.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  Buku
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  Jurnal
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                  Referensi Riset
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.7)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Cari Koleksi
              </p>
              <form
                onSubmit={handleSubmit}
                className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="relative flex-1">
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari judul, penulis, subjek, atau ISBN"
                    className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder-white/60 outline-none transition focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-[#F59E0B]/60"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-[#2A170C] shadow-[0_18px_35px_-22px_rgba(245,158,11,0.65)] transition hover:bg-[#FBBF24] active:scale-[0.98]"
                >
                  Cari
                </button>
              </form>
              <p className="mt-2 text-xs text-white/60">
                Gunakan kata kunci judul, penulis, subjek, atau ISBN.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Filter Bar Component */}
        <KoleksiFilter
          selectedCategory={filterKategori}
          onCategoryChange={handleCategoryChange}
          selectedKetersediaan={filterKetersediaan}
          onKetersediaanChange={setFilterKetersediaan}
          selectedTahun={filterTahun}
          onTahunChange={handleTahunChange}
          selectedSubjeks={filterSubjeks}
          onSubjekChange={handleSubjekChange}
          onResetFilters={handleResetFilters}
        />

        {/* Result count */}
        {!isLoading && rows.length > 0 && (
          <p className="mb-4 text-sm text-slate-500">
            Menampilkan{" "}
            <span className="font-semibold text-slate-700">{rows.length}</span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-700">
              {totalData.toLocaleString("id-ID")}
            </span>{" "}
            koleksi
            {keyword && (
              <>
                {" "}
                untuk kata kunci &quot;
                <span className="font-semibold text-[#6b3a22]">{keyword}</span>
                &quot;
              </>
            )}
          </p>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[3/4] w-full animate-pulse bg-slate-200" />
                <div className="flex flex-col gap-2 p-3">
                  <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="mt-1 h-5 w-16 animate-pulse rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-24 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-4 h-14 w-14 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-base font-semibold text-slate-600">
              Koleksi tidak ditemukan
            </p>
            <p className="mt-1 text-sm">Coba gunakan kata kunci yang berbeda</p>
          </div>
        )}

        {/* Book cards grid */}
        {!isLoading && rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {rows.map((book) => {
                const author =
                  cleanText(book.nama_orang) || "Penulis tidak diketahui";
                const subject = cleanText(book.subjek);
                return (
                  <Link
                    key={book.id}
                    href={`/koleksi/${book.id}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Cover */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
                      <img
                        src={cleanText(book.url_sampul) || FALLBACK_COVER}
                        alt={book.judul ?? "Cover buku"}
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = FALLBACK_COVER;
                        }}
                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col gap-1.5 p-3">
                      {book.jenis_koleksi && (
                        <span className="inline-block self-start rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                          {cleanText(book.jenis_koleksi)}
                        </span>
                      )}
                      <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-800">
                        {cleanText(book.judul) || "Tanpa Judul"}
                      </h3>
                      <p className="line-clamp-1 text-[11px] text-slate-500">
                        {author}
                      </p>
                      {subject && (
                        <div className="mt-auto pt-1">
                          <span className="inline-block max-w-full truncate rounded-full bg-[#6b3a22]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6b3a22]">
                            {subject}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>

                {/* Page number pills */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(
                      1,
                      Math.min(page - 2, totalPages - 4),
                    );
                    const pg = start + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`min-w-[36px] rounded-lg border px-2 py-2 text-sm font-medium transition ${
                          pg === page
                            ? "border-[#6b3a22] bg-[#6b3a22] text-white shadow"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Selanjutnya →
                </button>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-slate-400">
              Halaman {page} dari {totalPages}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
