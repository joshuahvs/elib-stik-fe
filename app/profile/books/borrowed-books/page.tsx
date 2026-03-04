"use client";

import { useEffect, useMemo, useState } from "react";

type BorrowStatus = "Dikembalikan" | "Dipinjam" | "Terlambat";

type BorrowedBook = {
  id: string;
  judul: string;
  penulis: string;
  tanggalPinjam: string; // ISO date
  jatuhTempo: string; // ISO date
  tanggalKembali?: string; // ISO date
};

const DUMMY_BORROWED_BOOKS: BorrowedBook[] = Array.from({ length: 23 }).map(
  (_, i) => {
    const idx = i + 1;
    const baseBorrow = new Date("2026-02-01T00:00:00.000Z");
    baseBorrow.setUTCDate(baseBorrow.getUTCDate() + i);

    const due = new Date(baseBorrow);
    due.setUTCDate(due.getUTCDate() + 7);

    const returned = idx % 7 === 0;
    const returnDate = returned ? new Date(baseBorrow) : null;
    if (returnDate) returnDate.setUTCDate(returnDate.getUTCDate() + 5);

    return {
      id: `BRW-${String(idx).padStart(4, "0")}`,
      judul: `Judul Buku ${idx}`,
      penulis: `Penulis ${((idx - 1) % 5) + 1}`,
      tanggalPinjam: baseBorrow.toISOString().slice(0, 10),
      jatuhTempo: due.toISOString().slice(0, 10),
      tanggalKembali: returnDate
        ? returnDate.toISOString().slice(0, 10)
        : undefined,
    };
  },
);

function formatDate(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function getStatus(item: BorrowedBook, now: Date): BorrowStatus {
  if (item.tanggalKembali) return "Dikembalikan";

  const due = new Date(`${item.jatuhTempo}T23:59:59`);
  if (!Number.isNaN(due.getTime()) && now > due) return "Terlambat";
  return "Dipinjam";
}

function StatusPill({ status }: { status: BorrowStatus }) {
  const className =
    status === "Dikembalikan"
      ? "bg-slate-100 text-slate-700"
      : status === "Terlambat"
        ? "bg-slate-900 text-white"
        : "bg-white border text-slate-700";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {status}
    </span>
  );
}

export default function BorrowedBooksPage() {
  const books = DUMMY_BORROWED_BOOKS;

  const pageSize = 6;
  const [page, setPage] = useState(1);

  const totalItems = books.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const { pageItems, startIndex, endIndex } = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, totalItems);
    return {
      pageItems: books.slice(start, end),
      startIndex: totalItems === 0 ? 0 : start + 1,
      endIndex: end,
    };
  }, [books, page, pageSize, totalItems]);

  const pageNumbers = useMemo(() => {
    // Keep it simple: show up to 5 page numbers.
    const max = 5;
    if (totalPages <= max)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = Math.floor(max / 2);
    const start = Math.min(Math.max(1, page - half), totalPages - max + 1);
    return Array.from({ length: max }, (_, i) => start + i);
  }, [page, totalPages]);

  const now = useMemo(() => new Date(), []);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Buku yang Dipinjam
            </h1>
            <p className="mt-2 text-slate-600">
              Daftar buku yang sedang atau pernah kamu pinjam.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border bg-white">
          <div className="px-6 py-5 border-b">
            <div className="text-sm text-slate-600">
              {totalItems === 0 ? (
                "Belum ada data pinjaman."
              ) : (
                <>
                  Menampilkan{" "}
                  <span className="font-semibold text-slate-900">
                    {startIndex}
                  </span>
                  –
                  <span className="font-semibold text-slate-900">
                    {endIndex}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-slate-900">
                    {totalItems}
                  </span>
                </>
              )}
            </div>
          </div>

          {totalItems === 0 ? (
            <div className="px-6 py-12 text-center text-slate-600">
              Belum ada buku yang kamu pinjam.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left font-semibold px-6 py-3">ID</th>
                    <th className="text-left font-semibold px-6 py-3">Buku</th>
                    <th className="text-left font-semibold px-6 py-3">
                      Tanggal Pinjam
                    </th>
                    <th className="text-left font-semibold px-6 py-3">
                      Jatuh Tempo
                    </th>
                    <th className="text-left font-semibold px-6 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageItems.map((item) => {
                    const status = getStatus(item, now);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {item.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {item.judul}
                          </div>
                          <div className="text-slate-600">{item.penulis}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {formatDate(item.tanggalPinjam)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {formatDate(item.jatuhTempo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusPill status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalItems > 0 ? (
            <div className="px-6 py-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-slate-600">
                Halaman{" "}
                <span className="font-semibold text-slate-900">{page}</span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-900">
                  {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={[
                    "px-3 py-2 rounded-lg border text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                    page <= 1
                      ? "text-slate-400 border-slate-200 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((p) => {
                    const isActive = p === page;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={[
                          "min-w-10 px-3 py-2 rounded-lg text-sm border",
                          "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                          isActive
                            ? "bg-slate-900 text-white border-slate-900"
                            : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className={[
                    "px-3 py-2 rounded-lg border text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                    page >= totalPages
                      ? "text-slate-400 border-slate-200 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
