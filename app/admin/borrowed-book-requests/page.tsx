"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/app/lib/api";
import { fetchAdminUsers } from "@/app/lib/adminUsers";
import {
  fetchAdminPeminjamanBuku,
  setujuiPerpanjanganByAdmin,
  tolakPerpanjanganByAdmin,
  updatePeminjamanBukuByAdmin,
} from "@/app/lib/peminjamanBuku";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";

function getRole(me: any): string | undefined {
  return me?.role ?? me?.data?.role ?? me?.user?.role ?? undefined;
}

function toIsoDate(value: any): string {
  if (typeof value === "string") {
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

function todayIsoLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(isoDate: string) {
  if (!isoDate) return "-";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function statusLabel(statusRaw: any): string {
  const s = String(statusRaw ?? "-").toUpperCase();
  if (s === "DIAJUKAN") return "Diajukan";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  if (s === "DIPINJAM" || s === "DIAMBIL") return "Diambil";
  if (s === "DIKEMBALIKAN") return "Dikembalikan";
  return String(statusRaw ?? "-");
}

function statusBadgeClass(statusRaw: any): string {
  const s = String(statusRaw ?? "").toUpperCase();
  if (s === "DIAJUKAN") return "bg-blue-600 text-white";
  if (s === "DISETUJUI") return "bg-green-600 text-white";
  if (s === "DIPINJAM" || s === "DIAMBIL") return "bg-purple-600 text-white";
  if (s === "DIKEMBALIKAN") return "bg-slate-200 text-slate-700";
  if (s === "DITOLAK") return "bg-red-600 text-white";
  return "bg-white border text-slate-700";
}

function normalizeStatus(statusRaw: any): string {
  const s = String(statusRaw ?? "").toUpperCase();
  if (s === "DIAMBIL") return "DIPINJAM";
  return s;
}

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function parseRequestedPeriodeHari(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.trunc(raw);
    return n > 0 ? n : null;
  }
  if (typeof raw === "string") {
    const n = Number(raw.trim());
    if (!Number.isFinite(n)) return null;
    const int = Math.trunc(n);
    return int > 0 ? int : null;
  }
  return null;
}

function isoDateToUtcMs(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mon) || !Number.isFinite(d)) {
    return null;
  }
  if (mon < 1 || mon > 12 || d < 1 || d > 31) return null;
  return Date.UTC(y, mon - 1, d);
}

function computePeriodeFromDates(
  tanggalPeminjaman?: string,
  akhirPeminjaman?: string,
): number | null {
  if (!tanggalPeminjaman || !akhirPeminjaman) return null;
  const startMs = isoDateToUtcMs(tanggalPeminjaman);
  const endMs = isoDateToUtcMs(akhirPeminjaman);
  if (startMs == null || endMs == null) return null;
  const diffDays = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000));
  return diffDays > 0 ? diffDays : null;
}

function isLikelyUuid(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
}

type AdminLoanRow = {
  id: string;
  status: string;
  statusPerpanjangan?: string;
  catatan?: string;
  tanggal_peminjaman?: string;
  akhir_peminjaman?: string;
  akhirPerpanjangan?: string;
  requestedPeriodeHari?: number;
  bukuJudul: string;
  userId: string | null;
  userName: string | null;
};

function mapAdminLoan(row: any): AdminLoanRow {
  const buku = row?.buku ?? row?.book ?? row?.buku_detail ?? null;
  const user = row?.user ?? row?.peminjam ?? null;

  const id = String(row?.id ?? row?.loanId ?? row?.peminjamanId ?? "-");
  const status = String(row?.status ?? "-");
  const statusPerpanjangan =
    typeof row?.status_perpanjangan === "string"
      ? row.status_perpanjangan
      : typeof row?.statusPerpanjangan === "string"
        ? row.statusPerpanjangan
        : undefined;
  const catatan =
    typeof row?.catatan === "string"
      ? row.catatan.trim() || undefined
      : undefined;

  const tanggal_peminjaman =
    toIsoDate(
      row?.tanggal_peminjaman ?? row?.tanggalPinjam ?? row?.start_date,
    ) || undefined;

  const akhir_peminjaman =
    toIsoDate(row?.akhir_peminjaman ?? row?.jatuhTempo ?? row?.end_date) ||
    undefined;

  const akhirPerpanjangan =
    toIsoDate(row?.akhir_perpanjangan ?? row?.akhirPerpanjangan) || undefined;

  const requestedPeriodeHari =
    parseRequestedPeriodeHari(
      row?.periode_hari ??
        row?.periodeHari ??
        row?.durasi_hari ??
        row?.durasiHari ??
        row?.hari_pengajuan ??
        row?.hariPengajuan,
    ) ??
    computePeriodeFromDates(tanggal_peminjaman, akhir_peminjaman) ??
    undefined;

  const bukuJudul =
    pickFirstString(buku, ["judul", "title", "nama"]) ??
    pickFirstString(row, ["judul", "title"]) ??
    "(Tanpa judul)";

  const userId =
    pickFirstString(user, ["id", "userId", "user_id"]) ??
    pickFirstString(row, [
      "userId",
      "user_id",
      "peminjamId",
      "peminjam_id",
      "borrowerId",
      "borrower_id",
    ]) ??
    (typeof row?.user === "string" ? row.user : undefined) ??
    (typeof row?.peminjam === "string" ? row.peminjam : undefined) ??
    null;

  const userName =
    pickFirstString(user, [
      "nama_lengkap",
      "namaLengkap",
      "full_name",
      "fullName",
      "name",
      "username",
      "email",
    ]) ??
    pickFirstString(row, [
      "nama_lengkap",
      "namaLengkap",
      "user_name",
      "user_username",
      "username",
      "user_email",
      "email",
    ]) ??
    null;

  return {
    id,
    status,
    statusPerpanjangan,
    catatan,
    tanggal_peminjaman,
    akhir_peminjaman,
    akhirPerpanjangan,
    requestedPeriodeHari,
    bukuJudul,
    userId,
    userName,
  };
}

export default function AdminBorrowedBookRequestsPage() {
  const [token, setToken] = useState<string | null>(null);

  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<AdminLoanRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [userNameById, setUserNameById] = useState<Record<string, string>>({});

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState<number | undefined>(undefined);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [tanggalPinjam, setTanggalPinjam] = useState<string>("");
  const [periodeHari, setPeriodeHari] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectMode, setRejectMode] = useState<"PINJAMAN" | "PERPANJANGAN">(
    "PINJAMAN",
  );
  const [rejectRow, setRejectRow] = useState<AdminLoanRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
        const role = getRole(me);
        setIsAdmin(role === "admin");
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setMeLoading(false));
  }, []);

  async function load(nextPage = 1) {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    setActionError(null);

    try {
      const res = await fetchAdminPeminjamanBuku({
        token,
        page: nextPage,
        limit,
      });

      const mapped = (res.items ?? []).map(mapAdminLoan);
      setRows(mapped);
      setTotal(res.total);
      setPage(res.page ?? nextPage);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
      setRows([]);
      setTotal(undefined);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, token, isAdmin, page]);

  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;

    let cancelled = false;

    // Fetch user list once so we can render names instead of UUIDs.
    fetchAdminUsers({ token, limit: 500 })
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const u of res.data ?? []) {
          const label =
            typeof u.nama_lengkap === "string" && u.nama_lengkap.trim()
              ? u.nama_lengkap.trim()
              : typeof u.username === "string" && u.username.trim()
                ? u.username.trim()
                : typeof u.email === "string" && u.email.trim()
                  ? u.email.trim()
                  : "";
          if (label) map[u.id] = label;
        }
        setUserNameById(map);
      })
      .catch(() => {
        // Ignore; we'll fall back to any name/email found on the loan row.
      });

    return () => {
      cancelled = true;
    };
  }, [meLoading, token, isAdmin]);

  const totalPages = useMemo(() => {
    if (typeof total === "number") return Math.max(1, Math.ceil(total / limit));
    return Math.max(1, Math.ceil(rows.length / limit));
  }, [total, rows.length]);

  const akhirPinjam = useMemo(() => {
    if (!tanggalPinjam) return "";
    const days = Number.isFinite(periodeHari) ? Math.trunc(periodeHari) : 0;
    if (days <= 0) return "";

    const [y, m, d] = tanggalPinjam.split("-").map((v) => Number(v));
    if (!y || !m || !d) return "";
    const start = new Date(y, m - 1, d);
    if (Number.isNaN(start.getTime())) return "";
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    const yyyy = end.getFullYear();
    const mm = String(end.getMonth() + 1).padStart(2, "0");
    const dd = String(end.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [tanggalPinjam, periodeHari]);

  function openApproveModal(row: AdminLoanRow) {
    setApproveId(row.id);
    setApproveError(null);

    const initialTanggal = row.tanggal_peminjaman || toIsoDate(new Date());
    const initialPeriode =
      typeof row.requestedPeriodeHari === "number" &&
      Number.isFinite(row.requestedPeriodeHari) &&
      row.requestedPeriodeHari > 0
        ? Math.trunc(row.requestedPeriodeHari)
        : 7;
    setTanggalPinjam(initialTanggal);
    setPeriodeHari(initialPeriode);

    setApproveOpen(true);
  }

  function openRejectModal(
    row: AdminLoanRow,
    mode: "PINJAMAN" | "PERPANJANGAN",
  ) {
    setRejectMode(mode);
    setRejectRow(row);
    setRejectReason("");
    setRejectError(null);
    setRejectOpen(true);
  }

  function closeRejectModal(force = false) {
    if (rejectSubmitting && !force) return;
    setRejectOpen(false);
    setRejectRow(null);
    setRejectError(null);
    setRejectReason("");
  }

  async function approve() {
    if (!token || !approveId) return;
    if (!tanggalPinjam || !akhirPinjam) return;

    try {
      setSubmitting(true);
      setApproveError(null);
      await updatePeminjamanBukuByAdmin({
        token,
        id: approveId,
        status: "DISETUJUI",
        tanggal_peminjaman: tanggalPinjam,
        akhir_peminjaman: akhirPinjam,
      });

      setRows((prev) =>
        prev.map((r) =>
          r.id === approveId
            ? {
                ...r,
                status: "DISETUJUI",
                tanggal_peminjaman: tanggalPinjam,
                akhir_peminjaman: akhirPinjam,
              }
            : r,
        ),
      );
      setApproveOpen(false);
      setApproveId(null);
    } catch (e: any) {
      setApproveError(getErrorMessage(e, "Gagal menyetujui peminjaman"));
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(opts: {
    rowId: string;
    prevStatus: string;
    nextStatus: string;
  }) {
    if (!token) return;

    const prev = opts.prevStatus;
    const next = opts.nextStatus;
    if (!next || next === prev) return;

    setRows((current) =>
      current.map((r) => (r.id === opts.rowId ? { ...r, status: next } : r)),
    );

    try {
      setMutatingId(opts.rowId);
      setActionError(null);
      await updatePeminjamanBukuByAdmin({
        token,
        id: opts.rowId,
        status: next,
        tanggal_pengembalian:
          next === "DIKEMBALIKAN" ? todayIsoLocal() : undefined,
      });
    } catch (e) {
      setRows((current) =>
        current.map((r) => (r.id === opts.rowId ? { ...r, status: prev } : r)),
      );
      setActionError(getErrorMessage(e, "Gagal mengubah status peminjaman"));
    } finally {
      setMutatingId(null);
    }
  }

  async function submitReject() {
    if (!token || !rejectRow) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Alasan penolakan wajib diisi");
      return;
    }

    try {
      setRejectSubmitting(true);
      setRejectError(null);
      setActionError(null);
      setMutatingId(rejectRow.id);

      if (rejectMode === "PINJAMAN") {
        await updatePeminjamanBukuByAdmin({
          token,
          id: rejectRow.id,
          status: "DITOLAK",
          catatan: reason,
        });

        setRows((current) =>
          current.map((r) =>
            r.id === rejectRow.id
              ? {
                  ...r,
                  status: "DITOLAK",
                  catatan: reason,
                }
              : r,
          ),
        );
      } else {
        await tolakPerpanjanganByAdmin({
          token,
          id: rejectRow.id,
          catatan: reason,
        });

        setRows((current) =>
          current.map((r) =>
            r.id === rejectRow.id
              ? {
                  ...r,
                  statusPerpanjangan: "DITOLAK",
                  catatan: reason,
                }
              : r,
          ),
        );
      }

      closeRejectModal(true);
    } catch (e) {
      setRejectError(
        getErrorMessage(
          e,
          rejectMode === "PINJAMAN"
            ? "Gagal menolak peminjaman"
            : "Gagal menolak perpanjangan",
        ),
      );
    } finally {
      setRejectSubmitting(false);
      setMutatingId(null);
    }
  }

  async function approvePerpanjangan(row: AdminLoanRow) {
    if (!token) return;

    try {
      setMutatingId(row.id);
      setActionError(null);
      await setujuiPerpanjanganByAdmin({ token, id: row.id });

      setRows((current) =>
        current.map((r) =>
          r.id === row.id
            ? {
                ...r,
                statusPerpanjangan: "DISETUJUI",
              }
            : r,
        ),
      );
    } catch (e) {
      setActionError(getErrorMessage(e, "Gagal menyetujui perpanjangan"));
    } finally {
      setMutatingId(null);
    }
  }

  const empty = !isLoading && rows.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Permintaan Peminjaman Buku
            </h1>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
          <Link href="/" className="text-sm underline text-slate-700">
            Kembali
          </Link>
        </div>

        {!meLoading && !token ? (
          <div className="mt-8 rounded-2xl border p-6 text-slate-700">
            Kamu belum login.
            <div className="mt-4">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {!meLoading && token && !isAdmin ? (
          <div className="mt-8 rounded-2xl border p-6 text-slate-700">
            <div className="font-semibold text-slate-900">Akses ditolak</div>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <section className="mt-8 rounded-2xl border bg-white">
            <div className="px-6 py-5 border-b flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                {typeof total === "number" ? (
                  <>
                    Total{" "}
                    <span className="font-semibold text-slate-900">
                      {total}
                    </span>
                  </>
                ) : (
                  <>
                    Menampilkan{" "}
                    <span className="font-semibold text-slate-900">
                      {rows.length}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => load(page)}
                className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50"
                disabled={isLoading}
              >
                {isLoading ? "Memuat…" : "Refresh"}
              </button>
            </div>

            {actionError ? (
              <div className="px-6 pt-6">
                <ErrorMessage error={actionError} />
              </div>
            ) : null}

            {error && !isLoading ? (
              <div className="px-6 py-6">
                <ErrorMessage error={error} />
              </div>
            ) : null}

            {isLoading ? (
              <div className="px-6 py-12 text-center text-slate-600">
                Memuat…
              </div>
            ) : empty ? (
              <div className="px-6 py-12 text-center text-slate-600">
                Belum ada permintaan peminjaman.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="text-left font-semibold px-6 py-3">ID</th>
                      <th className="text-left font-semibold px-6 py-3">
                        Peminjam
                      </th>
                      <th className="text-left font-semibold px-6 py-3">
                        Buku
                      </th>
                      <th className="text-left font-semibold px-6 py-3">
                        Mulai
                      </th>
                      <th className="text-left font-semibold px-6 py-3">
                        Akhir
                      </th>
                      <th className="text-left font-semibold px-6 py-3">
                        Status
                      </th>
                      <th className="text-left font-semibold px-6 py-3">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((r) => {
                      const normalizedStatus = normalizeStatus(r.status);
                      const isPending = normalizedStatus === "DIAJUKAN";
                      const isReturned = normalizedStatus === "DIKEMBALIKAN";
                      const normalizedExt = String(
                        r.statusPerpanjangan ?? "",
                      ).toUpperCase();
                      const extLabel =
                        normalizedExt === "DIAJUKAN"
                          ? "Diajukan"
                          : normalizedExt === "DISETUJUI"
                            ? "Disetujui"
                            : normalizedExt === "DITOLAK"
                              ? "Ditolak"
                              : "";
                      const extPending = normalizedExt === "DIAJUKAN";
                      const showAlasanDitolak =
                        Boolean(r.catatan) &&
                        (normalizedStatus === "DITOLAK" ||
                          normalizedExt === "DITOLAK");

                      const canEditStatus =
                        !isPending &&
                        !isReturned &&
                        (normalizedStatus === "DISETUJUI" ||
                          normalizedStatus === "DIPINJAM");

                      const resolvedUser =
                        (r.userId ? userNameById[r.userId] : undefined) ??
                        r.userName ??
                        "-";
                      const safeUser =
                        isLikelyUuid(resolvedUser) || !resolvedUser.trim()
                          ? "-"
                          : resolvedUser;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                            {r.id}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {safeUser}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {r.bukuJudul}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                            {r.tanggal_peminjaman
                              ? formatDate(r.tanggal_peminjaman)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                            {r.akhir_peminjaman
                              ? formatDate(r.akhir_peminjaman)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-2">
                              {canEditStatus ? (
                                <div className="relative inline-flex">
                                  <select
                                    value={normalizedStatus}
                                    onChange={(e) => {
                                      const next = String(e.target.value);
                                      void setStatus({
                                        rowId: r.id,
                                        prevStatus: normalizedStatus,
                                        nextStatus: next,
                                      });
                                    }}
                                    disabled={mutatingId === r.id}
                                    className={[
                                      "h-7 rounded-full pl-3 pr-8 text-xs font-medium",
                                      "appearance-none",
                                      "focus:outline-none focus:ring-2 focus:ring-slate-200",
                                      statusBadgeClass(normalizedStatus),
                                      mutatingId === r.id
                                        ? "opacity-60 cursor-not-allowed"
                                        : "cursor-pointer",
                                    ].join(" ")}
                                  >
                                    {normalizedStatus === "DISETUJUI" ? (
                                      <>
                                        <option value="DISETUJUI">
                                          {statusLabel("DISETUJUI")}
                                        </option>
                                        <option value="DIPINJAM">
                                          {statusLabel("DIPINJAM")}
                                        </option>
                                        <option value="DIKEMBALIKAN">
                                          {statusLabel("DIKEMBALIKAN")}
                                        </option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="DIPINJAM">
                                          {statusLabel("DIPINJAM")}
                                        </option>
                                        <option value="DIKEMBALIKAN">
                                          {statusLabel("DIKEMBALIKAN")}
                                        </option>
                                      </>
                                    )}
                                  </select>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-80"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                    statusBadgeClass(normalizedStatus),
                                  ].join(" ")}
                                >
                                  {statusLabel(normalizedStatus)}
                                </span>
                              )}

                              {extLabel ? (
                                <div className="text-xs text-slate-600 whitespace-normal break-words">
                                  <span className="font-medium text-slate-900">
                                    Perpanjangan:
                                  </span>{" "}
                                  {extLabel}
                                  {r.akhirPerpanjangan ? (
                                    <>
                                      <span className="text-slate-400">
                                        {" "}
                                        ·{" "}
                                      </span>
                                      <span>
                                        hingga {formatDate(r.akhirPerpanjangan)}
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
                                  {r.catatan}
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {extPending ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void approvePerpanjangan(r)}
                                  disabled={mutatingId === r.id}
                                  className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Setujui Perpanjangan
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRejectModal(r, "PERPANJANGAN")
                                  }
                                  disabled={mutatingId === r.id}
                                  className="inline-flex h-9 items-center rounded-lg bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Tolak Perpanjangan
                                </button>
                              </div>
                            ) : isPending ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openApproveModal(r)}
                                  disabled={mutatingId === r.id}
                                  className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Setujui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openRejectModal(r, "PINJAMAN")}
                                  disabled={mutatingId === r.id}
                                  className="inline-flex h-9 items-center rounded-lg bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Tolak
                                </button>
                              </div>
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

            {!isLoading && !error ? (
              <div className="px-6 py-5 border-t flex items-center justify-between gap-4">
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
                      page <= 1
                        ? "text-slate-400 border-slate-200 cursor-not-allowed"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    className={[
                      "px-3 py-2 rounded-lg border text-sm",
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
        ) : null}

        {approveOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setApproveOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white border p-6 shadow-lg">
              <div className="text-lg font-semibold text-slate-900">
                Setujui Peminjaman
              </div>

              <ErrorMessage error={approveError} className="mt-4" />

              <div className="mt-4 grid gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Tanggal Peminjaman
                  </label>
                  <input
                    type="date"
                    value={tanggalPinjam}
                    onChange={(e) => setTanggalPinjam(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Periode (hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={periodeHari}
                    onChange={(e) => setPeriodeHari(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-black"
                  />
                </div>

                <div className="text-sm text-slate-600">
                  Akhir Peminjaman: {akhirPinjam || "-"}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50"
                  onClick={() => setApproveOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={approve}
                  disabled={
                    submitting || !approveId || !tanggalPinjam || !akhirPinjam
                  }
                  className="h-10 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Menyimpan…" : "Setujui"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {rejectOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeRejectModal();
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white border p-6 shadow-lg">
              <div className="text-lg font-semibold text-slate-900">
                {rejectMode === "PINJAMAN"
                  ? "Tolak Peminjaman"
                  : "Tolak Perpanjangan"}
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Alasan penolakan ini akan ditampilkan ke pengguna di riwayat
                peminjaman.
              </p>

              <ErrorMessage error={rejectError} className="mt-4" />

              <div className="mt-4">
                <label className="block text-sm text-slate-700 mb-2">
                  Alasan Penolakan
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Buku sedang dalam perbaikan sehingga belum bisa dipinjam."
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-black"
                  disabled={rejectSubmitting}
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50"
                  onClick={() => closeRejectModal()}
                  disabled={rejectSubmitting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => void submitReject()}
                  disabled={
                    rejectSubmitting || !rejectRow || !rejectReason.trim()
                  }
                  className="h-10 px-4 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rejectSubmitting ? "Menyimpan…" : "Tolak"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
