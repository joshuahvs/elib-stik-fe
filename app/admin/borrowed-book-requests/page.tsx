"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { API_URL } from "@/app/lib/api";
import {
  fetchAdminPeminjamanBuku,
  updatePeminjamanBukuByAdmin,
} from "@/app/lib/peminjamanBuku";

function getRole(me: any): string | undefined {
  return me?.role ?? me?.data?.role ?? me?.user?.role ?? undefined;
}

function toIsoDate(value: any): string {
  if (typeof value === "string") {
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
  if (s === "DIPINJAM") return "Dipinjam";
  if (s === "DIKEMBALIKAN") return "Dikembalikan";
  return String(statusRaw ?? "-");
}

function statusBadgeClass(statusRaw: any): string {
  const s = String(statusRaw ?? "").toUpperCase();
  if (s === "DIAJUKAN") return "bg-slate-100 text-slate-700";
  if (s === "DISETUJUI") return "bg-slate-900 text-white";
  if (s === "DITOLAK") return "bg-rose-100 text-rose-700";
  return "bg-white border text-slate-700";
}

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

type AdminLoanRow = {
  id: string;
  status: string;
  tanggal_peminjaman?: string;
  akhir_peminjaman?: string;
  bukuJudul: string;
  userLabel: string;
};

function mapAdminLoan(row: any): AdminLoanRow {
  const buku = row?.buku ?? row?.book ?? row?.buku_detail ?? null;
  const user = row?.user ?? row?.peminjam ?? null;

  const id = String(row?.id ?? row?.loanId ?? row?.peminjamanId ?? "-");
  const status = String(row?.status ?? "-");

  const tanggal_peminjaman =
    toIsoDate(
      row?.tanggal_peminjaman ?? row?.tanggalPinjam ?? row?.start_date,
    ) || undefined;

  const akhir_peminjaman =
    toIsoDate(row?.akhir_peminjaman ?? row?.jatuhTempo ?? row?.end_date) ||
    undefined;

  const bukuJudul =
    pickFirstString(buku, ["judul", "title", "nama"]) ??
    pickFirstString(row, ["judul", "title"]) ??
    "(Tanpa judul)";

  const userLabel =
    pickFirstString(user, ["nama_lengkap", "namaLengkap", "name", "email"]) ??
    pickFirstString(row, ["user_email", "email"]) ??
    String(row?.userId ?? row?.user_id ?? "-");

  return {
    id,
    status,
    tanggal_peminjaman,
    akhir_peminjaman,
    bukuJudul,
    userLabel,
  };
}

export default function AdminBorrowedBookRequestsPage() {
  const [token, setToken] = useState<string | null>(null);

  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<AdminLoanRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState<number | undefined>(undefined);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [tanggalPinjam, setTanggalPinjam] = useState<string>("");
  const [periodeHari, setPeriodeHari] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);

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

    const initialTanggal = row.tanggal_peminjaman || toIsoDate(new Date());
    setTanggalPinjam(initialTanggal);
    setPeriodeHari(7);

    setApproveOpen(true);
  }

  async function approve() {
    if (!token || !approveId) return;
    if (!tanggalPinjam || !akhirPinjam) return;

    try {
      setSubmitting(true);
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
      alert(e?.message ?? "Gagal menyetujui peminjaman");
    } finally {
      setSubmitting(false);
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

            {error && !isLoading ? (
              <div className="px-6 py-12 text-center text-slate-600">
                <div className="font-semibold text-slate-900">Gagal memuat</div>
                <div className="mt-2">{error}</div>
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
                        User
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
                      const isPending =
                        String(r.status).toUpperCase() === "DIAJUKAN";
                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                            {r.id}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {r.userLabel}
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
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                statusBadgeClass(r.status),
                              ].join(" ")}
                            >
                              {statusLabel(r.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => openApproveModal(r)}
                                className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
                              >
                                Setujui
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
      </main>
    </div>
  );
}
