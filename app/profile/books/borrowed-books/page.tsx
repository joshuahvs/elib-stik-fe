"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Calendar, Minus, Plus, X, BookOpen, Clock, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from "lucide-react";
import { fetchDigitalSignedUrl } from "@/app/lib/booksDigital";
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
  urlSampul?: string;
};

const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' fill='%23f1f5f9'%3E%3Crect width='400' height='533' rx='8'/%3E%3Ctext x='50%25' y='42%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='42' font-weight='700' dy='.3em'%3E📖%3C/text%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' fill='%23cbd5e1' font-family='sans-serif' font-size='24' font-weight='600' dy='.3em'%3ENo Cover%3C/text%3E%3C/svg%3E";

function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/[\[\]'"]/g, "").trim();
}

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
    pickFirstString(buku, ["penulis", "author", "pengarang", "nama_orang"]) ??
    pickFirstString(row, ["penulis", "author", "nama_orang"]) ??
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

  // Extract cover URL from the buku relation
  const urlSampulRaw =
    pickFirstString(buku, ["url_sampul", "urlSampul", "cover_url", "coverUrl"]) ??
    pickFirstString(row, ["url_sampul", "urlSampul", "cover_url", "coverUrl"]);
  const urlSampul = urlSampulRaw ? cleanText(urlSampulRaw) || undefined : undefined;

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
    urlSampul,
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

/* ───────── Status Badge Component ───────── */
function StatusBadge({ status }: { status: BorrowStatus }) {
  const config: Record<BorrowStatus, { bg: string; text: string; dot: string; border: string }> = {
    Dikembalikan: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
    Diajukan: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", border: "border-amber-200" },
    Ditolak: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400", border: "border-rose-200" },
    Disetujui: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", border: "border-emerald-200" },
    Terlambat: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
    Dipinjam: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-400", border: "border-indigo-200" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

/* ───────── Due Date Progress ───────── */
function DueDateIndicator({ daysLeft, isPastDue, isReturned }: { daysLeft: number | null; isPastDue: boolean; isReturned: boolean }) {
  if (isReturned || daysLeft == null) return null;

  if (isPastDue) {
    const overdue = Math.max(1, -daysLeft);
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Terlambat {overdue} hari</span>
      </div>
    );
  }

  if (daysLeft <= 3) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>
          {daysLeft <= 0 ? "Jatuh tempo hari ini" : daysLeft === 1 ? "Jatuh tempo besok" : `${daysLeft} hari lagi`}
        </span>
      </div>
    );
  }

  return null;
}

/* ───────── Perpanjangan Modal ───────── */
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
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { if (!submitting) onClose(); }} />

      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
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
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 transition-colors"
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
                    "rounded-xl border px-4 py-4 text-center transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white border-transparent shadow-lg shadow-[#733015]/20"
                      : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
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
                "h-10 w-10 rounded-lg border flex items-center justify-center transition-colors",
                "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
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
                "h-10 w-10 rounded-lg border flex items-center justify-center transition-colors",
                "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
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
                "h-10 rounded-lg border px-4 text-sm font-medium transition-colors",
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
                "h-10 rounded-lg px-4 text-sm font-medium text-white transition-all",
                "bg-gradient-to-r from-[#733015] to-[#8b5529] shadow-lg shadow-[#733015]/20",
                "hover:shadow-xl hover:shadow-[#733015]/30",
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

/* ───────── Konfirmasi Perpanjangan Modal ───────── */
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
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl">
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
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="h-10 rounded-lg bg-gradient-to-r from-[#733015] to-[#8b5529] px-4 text-sm font-medium text-white shadow-lg shadow-[#733015]/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "Memproses…" : "Ya, Ajukan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Skeleton Card ───────── */
function SkeletonCard() {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-8 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

/* ───────── Main Page Component ───────── */
export default function BorrowedBooksPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [books, setBooks] = useState<BorrowedBook[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [openingDigitalId, setOpeningDigitalId] = useState<string | null>(null);
  const [digitalPreviewOpen, setDigitalPreviewOpen] = useState(false);
  const [digitalPreviewUrl, setDigitalPreviewUrl] = useState<string | null>(
    null,
  );
  const [digitalPreviewTitle, setDigitalPreviewTitle] = useState<string | null>(
    null,
  );
  const [digitalPreviewLoading, setDigitalPreviewLoading] = useState(false);

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

  function closeDigitalPreview() {
    setDigitalPreviewOpen(false);
    setDigitalPreviewUrl(null);
    setDigitalPreviewTitle(null);
    setDigitalPreviewLoading(false);
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

  async function handleOpenDigital(digitalId: string, title?: string) {
    const token = window.localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    try {
      setOpeningDigitalId(digitalId);
      setActionError(null);
      setDigitalPreviewTitle(title ?? "Buku Digital");
      setDigitalPreviewOpen(true);
      setDigitalPreviewLoading(true);
      setDigitalPreviewUrl(null);
      const { signedUrl } = await fetchDigitalSignedUrl({
        token,
        bookId: digitalId,
      });
      setDigitalPreviewUrl(signedUrl);
    } catch (e) {
      closeDigitalPreview();
      setActionError(getErrorMessage(e, "Gagal membuka buku digital"));
    } finally {
      setOpeningDigitalId(null);
      setDigitalPreviewLoading(false);
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

  const digitalPreviewSrc = useMemo(() => {
    if (!digitalPreviewUrl) return null;
    return `${digitalPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`;
  }, [digitalPreviewUrl]);

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
          sortBy: sortBy || undefined,
          sortOrder: sortOrder,
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

  // Count stats for the header
  const activeCount = useMemo(() => {
    return pageItems.filter((b) => {
      const s = getStatus(b, now);
      return s === "Dipinjam" || s === "Disetujui" || s === "Diajukan";
    }).length;
  }, [pageItems, now]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#4A2612] via-[#6B3A22] to-[#8A4D2E] text-white">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top_left,rgba(245,158,11,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-black/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <BookOpen className="h-7 w-7 text-white/90" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                E-Library STIK
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Riwayat Peminjaman
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-sm text-white/70">
            Daftar buku yang sedang atau pernah kamu pinjam. Pantau status, jatuh tempo, dan kelola perpanjangan peminjaman di sini.
          </p>

          {/* Quick stats */}
          {!loading && token && (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <div className="text-lg font-bold">{totalItems}</div>
                <div className="text-[11px] font-medium text-white/60">Total Peminjaman</div>
              </div>
              {activeCount > 0 && (
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                  <div className="text-lg font-bold">{activeCount}</div>
                  <div className="text-[11px] font-medium text-white/60">Sedang Aktif</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <ErrorMessage error={actionError} className="mb-6" />

        {/* ── Filter & Sort Controls ── */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:gap-6">
          {/* Status Filter */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5" />
              Filter Status
            </label>
            <select
              value={filterStatus || ""}
              onChange={(e) => handleFilterStatusChange(e.target.value || null)}
              className="h-10 px-4 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015] transition-colors"
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
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Urutkan
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
                    "h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    sortBy === option.value
                      ? "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white shadow-md shadow-[#733015]/20"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200",
                  ].join(" ")}
                >
                  {option.label}
                  {sortBy === option.value && (
                    <span className="text-xs opacity-80">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Result Count ── */}
        {!loading && totalItems > 0 && (
          <p className="mb-5 text-sm text-slate-500">
            Menampilkan{" "}
            <span className="font-semibold text-slate-700">{startIndex}</span>
            –
            <span className="font-semibold text-slate-700">{endIndex}</span>
            {" "}dari{" "}
            <span className="font-semibold text-slate-700">{totalItems}</span>
            {" "}peminjaman
          </p>
        )}

        {/* ── Content ── */}
        {!token && !loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-slate-500">
            <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-base font-semibold text-slate-600">Kamu belum login</p>
            <p className="mt-1 text-sm">Silakan masuk dulu untuk melihat riwayat peminjaman.</p>
            <Link href="/auth/login" className="mt-5 inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[#733015] to-[#8b5529] px-6 text-sm font-semibold text-white shadow-lg shadow-[#733015]/20 transition-all hover:shadow-xl">
              Ke halaman login
            </Link>
          </div>
        ) : loading ? (
          /* Skeleton Loading Grid */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: pageSize }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <ErrorMessage error={error} />
          </div>
        ) : totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-slate-500">
            <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-base font-semibold text-slate-600">Belum ada buku yang kamu pinjam</p>
            <p className="mt-1 text-sm">Jelajahi koleksi perpustakaan untuk mulai meminjam.</p>
            <Link href="/koleksi" className="mt-5 inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[#733015] to-[#8b5529] px-6 text-sm font-semibold text-white shadow-lg shadow-[#733015]/20 transition-all hover:shadow-xl">
              Jelajahi Koleksi
            </Link>
          </div>
        ) : (
          /* ── Book Cards Grid ── */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((item) => {
              const status = getStatus(item, now);
              const perpanjanganLabel = formatPerpanjanganStatus(item.statusPerpanjangan);
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

              const canRequestExtension =
                (status === "Dipinjam" || status === "Disetujui") &&
                !isReturned &&
                !hasPassedDueDate;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                >
                  {/* ── Card Top: Book Cover + Overlay Info ── */}
                  <div className="relative flex gap-0">
                    {/* Cover image */}
                    <div className="relative w-28 shrink-0 overflow-hidden bg-slate-100 sm:w-32">
                      <div className="aspect-[3/4] w-full">
                        <img
                          src={item.urlSampul || FALLBACK_COVER}
                          alt={`Cover ${item.judul}`}
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.onerror = null;
                            img.src = FALLBACK_COVER;
                          }}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      {/* Status overlay on image */}
                      <div className="absolute top-2 left-2">
                        <StatusBadge status={status} />
                      </div>
                    </div>

                    {/* Right side info */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      {/* Title & Author */}
                      <div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-[#733015] transition-colors">
                          {item.judul}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {cleanText(item.penulis) || "Penulis tidak diketahui"}
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>Pinjam: {item.tanggalPinjam ? formatDate(item.tanggalPinjam) : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>Tempo: {effectiveDueDate ? formatDate(effectiveDueDate) : "—"}</span>
                        </div>
                        {item.tanggalKembali && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
                            <span>Kembali: {formatDate(item.tanggalKembali)}</span>
                          </div>
                        )}
                      </div>

                      {/* Due date warning */}
                      <DueDateIndicator daysLeft={until} isPastDue={isPastDue} isReturned={isReturned} />
                    </div>
                  </div>

                  {/* ── Card Bottom: Extended Info & Actions ── */}
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    {/* Return status badge */}
                    {returnedLateDays ? (
                      <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700">
                        <AlertCircle className="h-3 w-3" />
                        Dikembalikan terlambat {returnedLateDays} hari
                      </div>
                    ) : returnedOnTime ? (
                      <div className="mb-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        ✓ Dikembalikan tepat waktu
                      </div>
                    ) : null}

                    {/* Perpanjangan info */}
                    {perpanjanganLabel ? (
                      <div className="mb-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Perpanjangan: </span>
                        <span className={
                          perpanjanganLabel === "Disetujui"
                            ? "text-emerald-600 font-semibold"
                            : perpanjanganLabel === "Ditolak"
                              ? "text-rose-600 font-semibold"
                              : "text-amber-600 font-semibold"
                        }>
                          {perpanjanganLabel}
                        </span>
                        {item.akhirPerpanjangan && (
                          <span className="text-slate-400"> · hingga {formatDate(item.akhirPerpanjangan)}</span>
                        )}
                      </div>
                    ) : null}

                    {/* Rejection reason */}
                    {showAlasanDitolak ? (
                      <div className="mb-2 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700">
                        <span className="font-semibold">Alasan ditolak: </span>
                        {item.catatan}
                      </div>
                    ) : null}

                    {/* Overdue warning in card */}
                    {isPastDue && (
                      <div className="mb-2 rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-700 flex items-start gap-1.5">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>Akan kena denda jika tidak segera mengembalikan.</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.bukuId && (
                        <Link
                          href={`/koleksi/${encodeURIComponent(item.bukuId)}`}
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                        >
                          Lihat Detail
                        </Link>
                      )}

                      {item.digitalId && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenDigital(item.digitalId!, item.judul)
                          }
                          disabled={openingDigitalId === item.digitalId}
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {openingDigitalId === item.digitalId
                            ? "Membuka…"
                            : "📖 Baca Digital"}
                        </button>
                      )}

                      {canRequestExtension && (
                        <button
                          type="button"
                          onClick={() => openPerpanjangan(item)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white bg-gradient-to-r from-[#733015] to-[#8b5529] shadow-md shadow-[#733015]/20 hover:shadow-lg hover:shadow-[#733015]/30 transition-all"
                        >
                          <Calendar className="h-3 w-3" />
                          Perpanjang
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalItems > 0 && !loading && !error && token ? (
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-sm text-slate-500">
              Halaman{" "}
              <span className="font-semibold text-slate-900">{page}</span>{" "}
              dari{" "}
              <span className="font-semibold text-slate-900">
                {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className={[
                  "h-9 w-9 flex items-center justify-center rounded-xl border text-sm transition-all",
                  page <= 1
                    ? "text-slate-300 border-slate-200 cursor-not-allowed"
                    : "text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                ].join(" ")}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {pageNumbers.map((p) => {
                const isActive = p === page;
                return (
                  <button
                    key={p}
                    type="button"
                    className={[
                      "h-9 min-w-9 px-3 rounded-xl text-sm font-medium border transition-all",
                      isActive
                        ? "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white border-transparent shadow-md shadow-[#733015]/20"
                        : "text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                    ].join(" ")}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                className={[
                  "h-9 w-9 flex items-center justify-center rounded-xl border text-sm transition-all",
                  page >= totalPages
                    ? "text-slate-300 border-slate-200 cursor-not-allowed"
                    : "text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                ].join(" ")}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Modals ── */}
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

        {digitalPreviewOpen ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDigitalPreview();
            }}
          >
            <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Preview Buku Digital (Read Only)
                  </h3>
                  {digitalPreviewTitle ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {digitalPreviewTitle}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeDigitalPreview}
                  className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {digitalPreviewLoading ? (
                <div className="flex h-[70vh] items-center justify-center text-sm text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#733015]" />
                    Memuat preview...
                  </div>
                </div>
              ) : digitalPreviewSrc ? (
                <iframe
                  src={digitalPreviewSrc}
                  title="Preview Buku Digital"
                  className="h-[70vh] w-full rounded-xl border border-slate-200"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="flex h-[70vh] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                  Preview belum tersedia.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
