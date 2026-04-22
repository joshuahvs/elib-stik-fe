"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Calendar, Minus, Plus, X } from "lucide-react";
import { fetchDigitalSignedUrl, openInNewTab } from "@/app/lib/booksDigital";
import {
  ajukanPerpanjanganPeminjaman,
  fetchRiwayatPeminjamanMe,
} from "@/app/lib/peminjamanBuku";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";

type BorrowStatus =
  | "Diajukan"
  | "Disetujui"
  | "Ditolak"
  | "Dikembalikan"
  | "Dipinjam"
  | "Terlambat";

type BorrowedBook = {
  id: string;
  bukuId?: string;
  judul: string;
  penulis: string;
  tanggalPinjam: string;
  jatuhTempo: string;
  tanggalKembali?: string;
  digitalId?: string;
  status?: string;
  statusPerpanjangan?: string;
  akhirPerpanjangan?: string;
  catatan?: string;
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
    const lead = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    if (lead) return lead[1];
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
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

  let tanggalKembali =
    toIsoDate(
      row?.tanggal_pengembalian ?? row?.tanggalKembali ?? row?.returned_at,
    ) || "";

  const rawStatus = String(row?.status ?? "").toUpperCase();
  if (!tanggalKembali && rawStatus === "DIKEMBALIKAN") {
    tanggalKembali = toIsoDate(row?.updated_at ?? row?.updatedAt) || "";
  }

  const bukuIdRaw = row?.buku_id ?? row?.bukuId ?? buku?.id ?? buku?.bukuId;
  const bukuId =
    bukuIdRaw != null && String(bukuIdRaw).trim()
      ? String(bukuIdRaw).trim()
      : undefined;

  const filePath = buku?.file_path ?? buku?.filePath ?? row?.file_path;
  const hasDigitalFilePath =
    typeof filePath === "string" && filePath.trim().length > 0;
  const digitalId = hasDigitalFilePath && bukuId ? bukuId : undefined;

  const statusPerpanjangan =
    typeof row?.status_perpanjangan === "string"
      ? row.status_perpanjangan
      : typeof row?.statusPerpanjangan === "string"
        ? row.statusPerpanjangan
        : undefined;

  const akhirPerpanjangan =
    toIsoDate(row?.akhir_perpanjangan ?? row?.akhirPerpanjangan) || undefined;

  const catatan =
    typeof row?.catatan === "string"
      ? row.catatan.trim() || undefined
      : undefined;

  return {
    id: String(loanId),
    bukuId,
    judul,
    penulis,
    tanggalPinjam: tanggalPinjam || "",
    jatuhTempo: jatuhTempo || "",
    tanggalKembali: tanggalKembali || undefined,
    digitalId,
    status: typeof row?.status === "string" ? row.status : undefined,
    statusPerpanjangan,
    akhirPerpanjangan,
    catatan,
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

function isoDateToUtcMs(isoDate: string): number | null {
  if (!isoDate) return null;

  const match = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return Date.UTC(year, month - 1, day);
}

function daysUntilDue(jatuhTempoIso: string, now: Date): number | null {
  const dueUtc = isoDateToUtcMs(jatuhTempoIso);
  if (dueUtc == null) return null;
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((dueUtc - nowUtc) / msPerDay);
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

function getEffectiveDueDate(item: BorrowedBook): string {
  const extStatus = String(item.statusPerpanjangan ?? "")
    .trim()
    .toUpperCase();
  if (extStatus === "DISETUJUI" && item.akhirPerpanjangan) {
    return item.akhirPerpanjangan;
  }
  return item.jatuhTempo;
}

function StatusPill({ status }: { status: BorrowStatus }) {
  const className =
    status === "Dikembalikan"
      ? "bg-slate-100 text-slate-700"
      : status === "Diajukan"
        ? "bg-blue-50 text-blue-700 border border-blue-200"
        : status === "Ditolak"
          ? "bg-rose-50 text-rose-700 border border-rose-200"
          : status === "Disetujui"
            ? "bg-emerald-600 text-white"
            : status === "Terlambat"
              ? "bg-rose-600 text-white"
              : "bg-indigo-50 text-indigo-700 border border-indigo-200";

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

type PerpanjanganModalProps = {
  open: boolean;
  judulBuku: string;
  durasiHari: number;
  submitting: boolean;
  error: unknown;
  onClose: () => void;
  onChangeDurasi: (n: number) => void;
  onSubmit: () => void;
};

function PerpanjanganModal({
  open,
  judulBuku,
  durasiHari,
  submitting,
  error,
  onClose,
  onChangeDurasi,
  onSubmit,
}: PerpanjanganModalProps) {
  if (!open) return null;

  const selected = Math.max(1, Math.min(30, Math.trunc(durasiHari)));
  const presets = [3, 7, 14];

  function setPreset(n: number) {
    if (submitting) return;
    onChangeDurasi(n);
  }

  function dec() {
    if (submitting) return;
    onChangeDurasi(Math.max(1, selected - 1));
  }

  function inc() {
    if (submitting) return;
    onChangeDurasi(Math.min(30, selected + 1));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50" />

      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl border">
        <div className="flex items-start justify-between gap-4 px-8 pt-7">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Perpanjang Peminjaman
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pilih durasi perpanjangan peminjaman buku Anda
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!submitting) onClose();
            }}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 pb-7 pt-5">
          <div className="text-xs text-slate-500">{judulBuku}</div>
          <div className="mt-4 text-sm text-slate-700">
            Berapa lama Anda ingin memperpanjang peminjaman?
          </div>

          <ErrorMessage error={error} className="mt-4" />

          <div className="mt-4 grid grid-cols-3 gap-3">
            {presets.map((n) => {
              const isActive = n === selected;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPreset(n)}
                  disabled={submitting}
                  className={[
                    "rounded-xl border px-4 py-4 text-center transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white border-transparent"
                      : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
                    submitting ? "opacity-80" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="text-xl font-semibold leading-none">{n}</div>
                  <div
                    className={[
                      "mt-1 text-xs",
                      isActive ? "text-white/90" : "text-slate-600",
                    ].join(" ")}
                  >
                    hari
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t" />

          <div className="mt-5 text-xs text-slate-600">
            Atau pilih durasi kustom:
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={dec}
              disabled={submitting || selected <= 1}
              className={[
                "h-10 w-10 rounded-lg border flex items-center justify-center",
                "bg-slate-50 text-slate-700 border-slate-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
              aria-label="Kurangi hari"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="flex-1 text-center">
              <div className="text-2xl font-semibold text-slate-900">
                {selected}
                <span className="text-sm font-medium text-slate-700">
                  {" "}
                  hari
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Maksimal 30 hari
              </div>
            </div>

            <button
              type="button"
              onClick={inc}
              disabled={submitting || selected >= 30}
              className={[
                "h-10 w-10 rounded-lg border flex items-center justify-center",
                "bg-slate-50 text-slate-700 border-slate-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
              aria-label="Tambah hari"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (!submitting) onClose();
              }}
              disabled={submitting}
              className={[
                "h-10 rounded-lg border px-4 text-sm font-medium",
                "border-slate-200 text-slate-700 hover:bg-slate-50",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className={[
                "h-10 rounded-lg px-4 text-sm font-medium text-white",
                "bg-gradient-to-r from-[#733015] to-[#8b5529]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {submitting ? "Memproses…" : `Perpanjang ${selected} Hari`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type KonfirmasiPerpanjanganModalProps = {
  open: boolean;
  judulBuku: string;
  durasiHari: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function KonfirmasiPerpanjanganModal({
  open,
  judulBuku,
  durasiHari,
  submitting,
  onClose,
  onConfirm,
}: KonfirmasiPerpanjanganModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50" />

      <div className="relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Konfirmasi Perpanjangan
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Ajukan perpanjangan{" "}
          <span className="font-medium">{durasiHari} hari</span>
          {judulBuku ? (
            <>
              {" "}
              untuk buku <span className="font-medium">{judulBuku}</span>
            </>
          ) : null}
          ?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="h-10 rounded-lg bg-gradient-to-r from-[#733015] to-[#8b5529] px-4 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Memproses…" : "Ya, Ajukan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BorrowedBooksPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [books, setBooks] = useState<BorrowedBook[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [openingDigitalId, setOpeningDigitalId] = useState<string | null>(null);

  const [perpanjanganOpen, setPerpanjanganOpen] = useState(false);
  const [perpanjanganLoan, setPerpanjanganLoan] = useState<BorrowedBook | null>(
    null,
  );
  const [perpanjanganDurasi, setPerpanjanganDurasi] = useState<number>(7);
  const [perpanjanganSubmitting, setPerpanjanganSubmitting] =
    useState<boolean>(false);
  const [perpanjanganError, setPerpanjanganError] = useState<unknown>(null);
  const [konfirmasiPerpanjanganOpen, setKonfirmasiPerpanjanganOpen] =
    useState<boolean>(false);

  // Filter and sort state
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  function openPerpanjangan(item: BorrowedBook) {
    setPerpanjanganLoan(item);
    setPerpanjanganDurasi(7);
    setPerpanjanganError(null);
    setPerpanjanganOpen(true);
  }

  function closePerpanjangan(force = false) {
    if (perpanjanganSubmitting && !force) return;
    setPerpanjanganOpen(false);
    setKonfirmasiPerpanjanganOpen(false);
    setPerpanjanganLoan(null);
    setPerpanjanganError(null);
  }

  function handleFilterStatusChange(status: string | null) {
    setFilterStatus(status);
    setPage(1);
  }

  function handleSortChange(newSortBy: string) {
    if (newSortBy === sortBy) {
      // Toggle sort order if same sort field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New sort field, default to desc
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function requestSubmitPerpanjangan() {
    if (!perpanjanganLoan || perpanjanganSubmitting) return;
    setKonfirmasiPerpanjanganOpen(true);
  }

  async function submitPerpanjanganConfirmed() {
    const authToken = window.localStorage.getItem("token");
    if (!authToken) {
      window.location.href = "/auth/login";
      return;
    }

    const loan = perpanjanganLoan;
    if (!loan) return;

    try {
      setPerpanjanganSubmitting(true);
      setPerpanjanganError(null);
      setActionError(null);

      await ajukanPerpanjanganPeminjaman({
        token: authToken,
        loanId: loan.id,
        durasiHari: perpanjanganDurasi,
      });

      closePerpanjangan(true);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setPerpanjanganError(e);
      setActionError(getErrorMessage(e, "Gagal mengajukan perpanjangan"));
    } finally {
      setPerpanjanganSubmitting(false);
      setKonfirmasiPerpanjanganOpen(false);
    }
  }

  async function handleOpenDigital(digitalId: string) {
    const token = window.localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    try {
      setOpeningDigitalId(digitalId);
      setActionError(null);
      const { signedUrl } = await fetchDigitalSignedUrl({
        token,
        bookId: digitalId,
      });
      openInNewTab(signedUrl);
    } catch (e) {
      setActionError(getErrorMessage(e, "Gagal membuka buku digital"));
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
          status: filterStatus || undefined,
          sortBy: sortBy === "due-date" ? "due-date" : undefined,
          sortOrder: sortBy === "due-date" ? sortOrder : undefined,
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
  }, [page, pageSize, refreshKey, token, filterStatus, sortBy, sortOrder]);

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

        <ErrorMessage error={actionError} className="mt-6" />

        {/* Filter and Sort Controls */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
          {/* Status Filter Dropdown */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-semibold text-slate-900">
              Filter Status
            </label>
            <select
              value={filterStatus || ""}
              onChange={(e) => handleFilterStatusChange(e.target.value || null)}
              className="px-4 py-2 rounded-lg text-sm border border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]"
            >
              <option value="">Semua Status</option>
              <option value="DIAJUKAN">Diajukan</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DITOLAK">Ditolak</option>
              <option value="DIPINJAM">Dipinjam</option>
              <option value="SELESAI">Selesai</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-semibold text-slate-900">
              Urutkan Berdasarkan
            </label>
            <div className="flex gap-2">
              {[
                { label: "Tanggal Terbaru", value: "date" },
                { label: "Jatuh Tempo", value: "due-date" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    sortBy === option.value
                      ? "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {option.label}
                  {sortBy === option.value && (
                    <span className="text-xs">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ErrorMessage error={actionError} className="mt-6" />

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
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
            <div className="px-6 py-6">
              <ErrorMessage error={error} />
            </div>
          ) : totalItems === 0 ? (
            <div className="px-6 py-12 text-center text-slate-600">
              Belum ada buku yang kamu pinjam.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-32" />
                  <col />
                  <col className="w-36" />
                  <col className="w-36" />
                  <col className="w-52" />
                  <col className="w-52" />
                </colgroup>
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold whitespace-nowrap">
                      Peminjaman #
                    </th>
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
                    <th className="px-6 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pageItems.map((item, idx) => {
                    const status = getStatus(item, now);
                    const perpanjanganLabel = formatPerpanjanganStatus(
                      item.statusPerpanjangan,
                    );
                    const effectiveDueDate = getEffectiveDueDate(item);
                    const showAlasanDitolak =
                      Boolean(item.catatan) &&
                      (status === "Ditolak" || perpanjanganLabel === "Ditolak");

                    const isReturned =
                      status === "Dikembalikan" || Boolean(item.tanggalKembali);

                    const returnedDeltaDays = (() => {
                      if (!isReturned || !item.tanggalKembali) return null;
                      const dueUtc = isoDateToUtcMs(effectiveDueDate);
                      const returnedUtc = isoDateToUtcMs(item.tanggalKembali);
                      if (dueUtc == null || returnedUtc == null) return null;
                      const msPerDay = 24 * 60 * 60 * 1000;
                      return Math.round((returnedUtc - dueUtc) / msPerDay);
                    })();

                    const returnedLateDays =
                      returnedDeltaDays != null && returnedDeltaDays > 0
                        ? returnedDeltaDays
                        : null;

                    const returnedOnTime =
                      returnedDeltaDays != null && returnedDeltaDays <= 0;

                    const until = daysUntilDue(effectiveDueDate, now);

                    const dueAt = effectiveDueDate
                      ? new Date(`${effectiveDueDate}T23:59:59`)
                      : null;
                    const hasPassedDueDate =
                      dueAt != null &&
                      !Number.isNaN(dueAt.getTime()) &&
                      now > dueAt;
                    const isPastDue = !isReturned && hasPassedDueDate;

                    const overdueDays =
                      isPastDue && until != null ? Math.max(1, -until) : null;

                    const isSoon =
                      !isPastDue &&
                      until != null &&
                      until >= 0 &&
                      until <= 3 &&
                      !item.tanggalKembali;

                    const dueSoonText = (() => {
                      if (!isSoon || until == null) return null;
                      if (until <= 0) return "Jatuh tempo hari ini";
                      if (until === 1) return "Jatuh tempo besok";
                      return `Jatuh tempo ${until} hari lagi`;
                    })();

                    const canRequestExtension =
                      (status === "Dipinjam" || status === "Disetujui") &&
                      !isReturned &&
                      !hasPassedDueDate;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {startIndex + idx}
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
                          <div className="flex flex-col items-start">
                            <div>
                              {effectiveDueDate
                                ? formatDate(effectiveDueDate)
                                : "—"}
                            </div>
                            {isSoon ? (
                              <div className="mt-1 inline-flex items-center gap-1 text-xs text-orange-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {dueSoonText ?? "Segera jatuh tempo!"}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col items-start gap-2">
                            <StatusPill status={status} />
                            {returnedLateDays ? (
                              <div className="inline-flex items-center gap-1 text-xs text-rose-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Dikembalikan terlambat {returnedLateDays} hari
                              </div>
                            ) : returnedOnTime ? (
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                Tepat waktu
                              </span>
                            ) : null}
                            {perpanjanganLabel ? (
                              <div className="text-xs text-slate-600 whitespace-normal break-words">
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
                            {showAlasanDitolak ? (
                              <div className="text-xs text-rose-700 whitespace-normal break-words">
                                <span className="font-medium">
                                  Alasan ditolak:
                                </span>{" "}
                                {item.catatan}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col items-end gap-2">
                            {item.bukuId ? (
                              <Link
                                href={`/koleksi/${encodeURIComponent(item.bukuId)}`}
                                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
                              >
                                Lihat Detail
                              </Link>
                            ) : null}

                            {item.digitalId ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDigital(item.digitalId!)
                                }
                                disabled={openingDigitalId === item.digitalId}
                                className={
                                  "inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                }
                              >
                                {openingDigitalId === item.digitalId
                                  ? "Membuka…"
                                  : "Baca Digital"}
                              </button>
                            ) : null}

                            {canRequestExtension ? (
                              <button
                                type="button"
                                onClick={() => openPerpanjangan(item)}
                                className={[
                                  "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white",
                                  "bg-gradient-to-r from-[#733015] to-[#8b5529]",
                                  "hover:opacity-95",
                                ].join(" ")}
                              >
                                <Calendar className="h-4 w-4" />
                                Perpanjangan
                              </button>
                            ) : isPastDue ? (
                              <div className="inline-flex max-w-full items-start gap-1.5 whitespace-normal text-xs text-rose-700">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                  Terlambat {overdueDays ?? 1} hari. Akan kena
                                  denda jika tidak segera mengembalikan.
                                </span>
                              </div>
                            ) : item.bukuId ? null : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalItems > 0 && !loading && !error && token ? (
            <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
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

        <PerpanjanganModal
          open={perpanjanganOpen}
          judulBuku={perpanjanganLoan?.judul ?? ""}
          durasiHari={perpanjanganDurasi}
          submitting={perpanjanganSubmitting}
          error={perpanjanganError}
          onClose={closePerpanjangan}
          onChangeDurasi={setPerpanjanganDurasi}
          onSubmit={requestSubmitPerpanjangan}
        />

        <KonfirmasiPerpanjanganModal
          open={konfirmasiPerpanjanganOpen}
          judulBuku={perpanjanganLoan?.judul ?? ""}
          durasiHari={Math.max(1, Math.min(30, Math.trunc(perpanjanganDurasi)))}
          submitting={perpanjanganSubmitting}
          onClose={() => setKonfirmasiPerpanjanganOpen(false)}
          onConfirm={submitPerpanjanganConfirmed}
        />
      </main>
    </div>
  );
}
