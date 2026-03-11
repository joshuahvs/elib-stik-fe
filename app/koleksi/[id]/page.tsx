"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchBukuById, type BukuRow } from "@/app/lib/koleksi";

// Strips stringified array artifacts like ['Value'] or ["Value"]
const cleanText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.replace(/[\[\]'"]/g, "").trim();
};

const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' fill='%23f1f5f9'%3E%3Crect width='400' height='533'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='48' font-weight='700' dy='.3em'%3EImage Not%3C/text%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='48' font-weight='700' dy='.3em'%3EAvailable%3C/text%3E%3C/svg%3E";

export default function KoleksiDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<BukuRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    fetchBukuById(params.id)
      .then((data) => {
        setBook(data);
        if (!data) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Breadcrumb header strip */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 text-sm text-slate-500">
          <a href="/" className="transition hover:text-[#6b3a22]">Beranda</a>
          <span>/</span>
          <a href="/koleksi" className="transition hover:text-[#6b3a22]">Koleksi</a>
          <span>/</span>
          <span className="line-clamp-1 text-slate-700">{book?.judul ?? "Detail"}</span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-[#6b3a22] hover:text-[#6b3a22]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Koleksi
        </button>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="w-full shrink-0 md:w-72">
              <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-slate-200" />
            </div>
            <div className="flex-1 space-y-4 pt-2">
              <div className="h-7 w-2/3 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-6 grid grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Not found */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-24 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-14 w-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-base font-semibold text-slate-600">Buku tidak ditemukan</p>
            <p className="mt-1 text-sm">ID yang diminta tidak tersedia.</p>
          </div>
        )}

        {/* Book detail */}
        {!isLoading && book && (
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            {/* Cover — large, with shadow */}
            <div className="w-full shrink-0 md:w-72">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
                <img
                  src={cleanText(book.url_sampul) || FALLBACK_COVER}
                  alt={book.judul ?? "Cover buku"}
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = FALLBACK_COVER;
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              {/* Availability badge below cover */}
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-700">Tersedia</span>
              </div>
              {book.no_panggil && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">No. Panggil</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-slate-700">{book.no_panggil}</p>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="flex-1">
              {/* Title + subject badge */}
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {cleanText(book.subjek) && (
                  <span className="rounded-full bg-[#6b3a22]/10 px-3 py-0.5 text-xs font-semibold text-[#6b3a22]">
                    {cleanText(book.subjek)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold leading-snug text-slate-800">
                {book.judul ?? "Tanpa Judul"}
              </h1>
              <p className="mt-1 text-base text-slate-500">
                {cleanText(book.nama_orang) || "Penulis tidak diketahui"}
              </p>

              <hr className="my-6 border-slate-200" />

              {/* Details grid */}
              <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                <DetailItem label="Penerbit" value={cleanText(book.penerbit)} />
                <DetailItem label="Tahun Terbit" value={book.tahun_terbit?.toString()} />
                <DetailItem label="ISBN" value={book.isbn} />
                <DetailItem label="Edisi" value={book.edisi} />
                <DetailItem label="Bahasa" value={book.bahasa} />
                <DetailItem label="Tempat Terbit" value={cleanText(book.tempat_terbit)} />
                <DetailItem label="Lembaga Pemilik" value={cleanText(book.lembaga_pemilik)} />
                <DetailItem label="Sumber" value={book.sumber} />
              </dl>

              {/* Location banner */}
              {book.lokasi && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#6b3a22]/20 bg-[#6b3a22]/5 px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-[#6b3a22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#6b3a22]/60">Lokasi Rak</p>
                    <p className="text-sm font-semibold text-[#6b3a22]">{book.lokasi}</p>
                  </div>
                </div>
              )}


            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-700">{value}</dd>
    </div>
  );
}
