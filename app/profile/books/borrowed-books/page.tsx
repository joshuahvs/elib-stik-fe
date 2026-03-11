"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchDigitalSignedUrl, openInNewTab } from "@/app/lib/booksDigital";
import { fetchRiwayatPeminjamanMe } from "@/app/lib/peminjamanBuku";

type BorrowStatus =
  | "Diajukan"
  | "Disetujui"
  | "Ditolak"
  | "Dikembalikan"
  | "Dipinjam"
  | "Terlambat";

type BorrowedBook = {
  id: string;
  judul: string;
  penulis: string;
  tanggalPinjam: string;
  jatuhTempo: string;
  tanggalKembali?: string;
  digitalId?: string;
  status?: string;
  statusPerpanjangan?: string;
  akhirPerpanjangan?: string;
};

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function toIsoDate(value: any): string {
  if (typeof value === "string") {
    // Common shapes: 'YYYY-MM-DD' or ISO timestamp.
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return "";
}

function mapLoanToBorrowedBook(row: any): BorrowedBook {
  const buku = row?.buku ?? row?.book ?? row?.buku_detail ?? null;

  const loanId =
    pickFirstString(row, ["id", "loanId", "peminjamanId", "kode"]) ??
    String(row?.id ?? "-");

  const judul =
    pickFirstString(buku, ["judul", "title", "nama"]) ??
    pickFirstString(row, ["judul", "title"]) ??
    "(Tanpa judul)";

  const penulis =
    pickFirstString(buku, ["penulis", "author", "pengarang"]) ??
    pickFirstString(row, ["penulis", "author"]) ??
    "-";

  const tanggalPinjam = toIsoDate(
    row?.tanggal_peminjaman ?? row?.tanggalPinjam ?? row?.start_date,
  );

  const jatuhTempo = toIsoDate(
    row?.akhir_peminjaman ?? row?.jatuhTempo ?? row?.end_date,
  );

  const tanggalKembali =
    toIsoDate(
      row?.tanggal_pengembalian ?? row?.tanggalKembali ?? row?.returned_at,
    ) || undefined;

  const bukuId = row?.bukuId ?? buku?.id ?? buku?.bukuId;
  const filePath = buku?.file_path ?? buku?.filePath ?? row?.file_path;
  const digitalId = filePath ? String(bukuId ?? "") : undefined;

  const statusPerpanjangan =
    typeof row?.status_perpanjangan === "string"
      ? row.status_perpanjangan
      : typeof row?.statusPerpanjangan === "string"
        ? row.statusPerpanjangan
        : undefined;

  const akhirPerpanjangan =
    toIsoDate(row?.akhir_perpanjangan ?? row?.akhirPerpanjangan) || undefined;

  return {
    id: String(loanId),
    judul,
    penulis,
    tanggalPinjam: tanggalPinjam || "",
    jatuhTempo: jatuhTempo || "",
    tanggalKembali,
    digitalId: digitalId && digitalId !== "" ? digitalId : undefined,
    status: typeof row?.status === "string" ? row.status : undefined,
    statusPerpanjangan,
    akhirPerpanjangan,
  };
}

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
  const backend = String(item.status ?? "").toUpperCase();
  if (backend === "DIAJUKAN") return "Diajukan";
  if (backend === "DISETUJUI") return "Disetujui";
  if (backend === "DITOLAK") return "Ditolak";
  if (backend === "DIKEMBALIKAN") return "Dikembalikan";
  if (backend === "DIPINJAM") return "Dipinjam";

  // Fallback: infer from dates (for older responses).
  if (item.tanggalKembali) return "Dikembalikan";

  const due = new Date(`${item.jatuhTempo}T23:59:59`);
  if (!Number.isNaN(due.getTime()) && now > due) return "Terlambat";
  return "Dipinjam";
}

function formatPerpanjanganStatus(statusRaw: any): string | null {
  if (statusRaw == null) return null;
  const raw = String(statusRaw).trim();
  if (!raw) return null;
  const s = raw.toUpperCase();
  if (s === "DIAJUKAN") return "Diajukan";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  return raw;
}

function StatusPill({ status }: { status: BorrowStatus }) {
  const className =
    status === "Dikembalikan"
      ? "bg-slate-100 text-slate-700"
      : status === "Diajukan"
        ? "bg-slate-100 text-slate-700"
        : status === "Ditolak"
          ? "bg-rose-100 text-rose-700"
          : status === "Disetujui"
            ? "bg-slate-800 text-white"
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<BorrowedBook[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const [openingDigitalId, setOpeningDigitalId] = useState<string | null>(null);

  async function handleOpenDigital(digitalId: string) {
    const token = window.localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    try {
      setOpeningDigitalId(digitalId);
      const { signedUrl } = await fetchDigitalSignedUrl({
        token,
        bookId: digitalId,
      });
      openInNewTab(signedUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal membuka buku digital";
      alert(msg);
    } finally {
      setOpeningDigitalId(null);
    }
  }

  const pageSize = 6;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const { pageItems, startIndex, endIndex } = useMemo(() => {
    // When using backend pagination, current page's items are already sliced.
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    return {
      pageItems: books,
      startIndex: start,
      endIndex: totalItems === 0 ? 0 : end,
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

  useEffect(() => {
    setToken(window.localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError(null);
      setBooks([]);
      setTotalItems(0);
      return;
    }

    const authToken = token;

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchRiwayatPeminjamanMe({
          token: authToken,
          page,
          limit: pageSize,
        });

        const mapped = (res.items ?? []).map(mapLoanToBorrowedBook);
        if (!cancelled) {
          setBooks(mapped);
          setTotalItems(res.total ?? mapped.length);
        }
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Gagal mengambil riwayat peminjaman";
        if (!cancelled) {
          setError(msg);
          setBooks([]);
          setTotalItems(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    function onFocus() {
      run();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") run();
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [page, pageSize, token]);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Riwayat Peminjaman
            </h1>
            <p className="mt-2 text-slate-600">
              Daftar buku yang sedang atau pernah kamu pinjam.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border bg-white">
          <div className="px-6 py-5 border-b">
            <div className="text-sm text-slate-600">
              {loading ? (
                "Memuat data pinjaman…"
              ) : totalItems === 0 ? (
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

          {!token && !loading ? (
            <div className="px-6 py-12 text-center text-slate-600">
              Kamu belum login. Silakan masuk dulu.
              <div className="mt-4">
                <Link href="/auth/login" className="underline text-slate-900">
                  Ke halaman login
                </Link>
              </div>
            </div>
          ) : loading ? (
            <div className="px-6 py-12 text-center text-slate-600">Memuat…</div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-slate-600">
              <div className="font-semibold text-slate-900">Gagal memuat</div>
              <div className="mt-2">{error}</div>
            </div>
          ) : totalItems === 0 ? (
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
                    <th className="text-left font-semibold px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageItems.map((item) => {
                    const status = getStatus(item, now);
                    const perpanjanganLabel = formatPerpanjanganStatus(
                      item.statusPerpanjangan,
                    );
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
                          {item.tanggalPinjam
                            ? formatDate(item.tanggalPinjam)
                            : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {item.jatuhTempo ? formatDate(item.jatuhTempo) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-2">
                            <StatusPill status={status} />
                            {perpanjanganLabel ? (
                              <div className="text-xs text-slate-600">
                                <span className="font-medium text-slate-900">
                                  Perpanjangan:
                                </span>{" "}
                                {perpanjanganLabel}
                                {item.akhirPerpanjangan ? (
                                  <>
                                    <span className="text-slate-400"> · </span>
                                    <span>
                                      hingga{" "}
                                      {formatDate(item.akhirPerpanjangan)}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.digitalId ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDigital(item.digitalId!)}
                              disabled={openingDigitalId === item.digitalId}
                              className={
                                "inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              }
                            >
                              {openingDigitalId === item.digitalId
                                ? "Membuka…"
                                : "Baca Digital"}
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalItems > 0 && !loading && !error && token ? (
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
