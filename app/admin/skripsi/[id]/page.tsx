"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  fetchSkripsiAdminDetail,
  fetchSkripsiSignedUrl,
  fetchSkripsiTtdSignedUrl,
  updateSkripsiStatus,
  type SkripsiRow,
} from "@/app/lib/skripsi";
import { openInNewTab } from "@/app/lib/booksDigital";

type StatusUi = "Pending" | "Disetujui" | "Ditolak" | "Dibatalkan" | "-";

function toUiStatus(raw: unknown): StatusUi {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  if (s === "DIBATALKAN") return "Dibatalkan";
  return "-";
}

function statusPill(status: StatusUi) {
  const className =
    status === "Pending"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : status === "Disetujui"
        ? "bg-emerald-600 text-white"
        : status === "Ditolak"
          ? "bg-rose-50 text-rose-700 border border-rose-200"
          : status === "Dibatalkan"
            ? "bg-slate-100 text-slate-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        className,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function formatDateOnly(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function getAuthorName(row: SkripsiRow) {
  const user = row.users ?? row.user;
  const name = String(user?.nama_lengkap ?? "").trim();
  if (name) return name;
  const username = String(user?.username ?? "").trim();
  if (username) return username;
  return "-";
}

function getAuthorNim(row: SkripsiRow) {
  const user = row.users ?? row.user;
  const nim = String(user?.nim ?? "").trim();
  return nim || "-";
}

function parsePenulisTambahan(
  items: unknown,
): Array<{ nim: string; nama: string }> {
  if (!Array.isArray(items)) return [];

  const out: Array<{ nim: string; nama: string }> = [];
  for (const item of items) {
    if (item == null) continue;

    if (typeof item === "string") {
      const s = item.trim();
      if (!s) continue;
      try {
        const parsed = JSON.parse(s);
        const nim = String(parsed?.nim ?? "").trim();
        const nama = String(parsed?.nama ?? "").trim();
        if (nim && nama) {
          out.push({ nim, nama });
          continue;
        }
      } catch {
        out.push({ nim: "-", nama: s });
        continue;
      }
      out.push({ nim: "-", nama: s });
      continue;
    }

    const nim = String((item as any)?.nim ?? "").trim();
    const nama = String((item as any)?.nama ?? "").trim();
    if (nim && nama) out.push({ nim, nama });
  }

  return out;
}

export default function AdminSkripsiDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [row, setRow] = useState<SkripsiRow | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [viewingFile, setViewingFile] = useState(false);
  const [viewingTtd, setViewingTtd] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
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
          if (!cancelled) setIsAdmin(false);
          return;
        }

        const data = await res.json().catch(() => null);
        const role = data?.role ?? data?.user?.role ?? data?.data?.role;
        if (!cancelled) setIsAdmin(role === "admin");
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id || !token || !isAdmin || meLoading) return;
    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchSkripsiAdminDetail({ token, id });
        if (!cancelled) setRow(data);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, "Gagal memuat detail"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id, token, isAdmin, meLoading]);

  const statusUi = useMemo(() => toUiStatus(row?.status), [row?.status]);
  const isPending = statusUi === "Pending";

  async function handlePreviewFile() {
    if (!token || !id) return;
    setViewingFile(true);
    setError(null);
    try {
      const res = await fetchSkripsiSignedUrl({ token, id });
      openInNewTab(res.signedUrl);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal membuka file skripsi"));
    } finally {
      setViewingFile(false);
    }
  }

  async function handlePreviewTtd() {
    if (!token || !id) return;
    setViewingTtd(true);
    setError(null);
    try {
      const res = await fetchSkripsiTtdSignedUrl({ token, id });
      openInNewTab(res.signedUrl);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal membuka file TTD"));
    } finally {
      setViewingTtd(false);
    }
  }

  async function handleApprove() {
    if (!token || !id) return;
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateSkripsiStatus({
        token,
        id,
        status: "DISETUJUI",
      });
      setRow((prev) => ({
        ...updated,
        users: updated.users ?? prev?.users ?? prev?.user,
        user: updated.user ?? prev?.user ?? prev?.users,
      }));
      setSuccess("Status skripsi berhasil diperbarui.");
    } catch (e) {
      setError(getErrorMessage(e, "Gagal memperbarui status"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleRejectSubmit() {
    if (!token || !id) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Alasan penolakan wajib diisi");
      return;
    }

    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateSkripsiStatus({
        token,
        id,
        status: "DITOLAK",
        alasan_ditolak: reason,
      });
      setRow((prev) => ({
        ...updated,
        users: updated.users ?? prev?.users ?? prev?.user,
        user: updated.user ?? prev?.user ?? prev?.users,
      }));
      setSuccess("Status skripsi berhasil diperbarui.");
      setRejectReason("");
      setRejectOpen(false);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal memperbarui status"));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!meLoading && !token ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Detail Pengajuan Skripsi
            </h1>
            <p className="mt-2 text-slate-600">Kamu belum login.</p>
            <div className="mt-6">
              <Link href="/auth/login" className="text-slate-900 underline">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {!meLoading && token && !isAdmin ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Detail Pengajuan Skripsi
            </h1>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Detail Pengajuan Skripsi
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Lihat metadata skripsi dan verifikasi pengajuan
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/admin/skripsi")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-[#6b3a22] hover:text-[#6b3a22]"
              >
                Kembali
              </button>
            </div>

            <ErrorMessage error={error} className="mb-4" />
            {success ? (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {success}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              </div>
            ) : row ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-800">
                      Informasi Skripsi
                    </h2>
                    {statusPill(statusUi)}
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Nama Penulis
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {getAuthorName(row)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        NIM
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {getAuthorNim(row)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Judul Skripsi
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {row.judul ?? "-"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Tahun
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {row.tahun ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Tanggal Pengajuan
                        </p>
                        <p className="mt-1 font-medium text-slate-800">
                          {formatDateOnly(row.created_at)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pembimbing
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {row.pembimbing ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Penguji
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {row.penguji ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Abstrak
                      </p>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {row.abstrak ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Penulis Tambahan
                      </p>
                      {parsePenulisTambahan(row.penulis_tambahan).length ===
                      0 ? (
                        <p className="mt-1 text-slate-700">-</p>
                      ) : (
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-700">
                          {parsePenulisTambahan(row.penulis_tambahan).map(
                            (p, idx) => (
                              <li key={`${p.nim}-${p.nama}-${idx}`}>
                                {p.nama} (NIM: {p.nim})
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                    {row.alasan_ditolak ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                          Alasan Penolakan
                        </p>
                        <p className="mt-1 text-rose-700">
                          {row.alasan_ditolak}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-800">
                    Dokumen Skripsi
                  </h2>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        File Skripsi (PDF)
                      </p>
                      <button
                        type="button"
                        onClick={handlePreviewFile}
                        disabled={viewingFile || viewingTtd}
                        className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {viewingFile ? "Memuat..." : "Preview"}
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        File TTD (PDF)
                      </p>
                      <button
                        type="button"
                        onClick={handlePreviewTtd}
                        disabled={viewingTtd || viewingFile}
                        className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {viewingTtd ? "Memuat..." : "Preview"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={!isPending || updating}
                      onClick={() => setRejectOpen(true)}
                      className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      disabled={!isPending || updating}
                      onClick={handleApprove}
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updating ? "Memproses..." : "Terima"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-700">
                  Data skripsi tidak ditemukan.
                </p>
              </div>
            )}
          </>
        ) : null}
      </main>

      {rejectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Tolak Pengajuan Skripsi
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Berikan alasan penolakan agar penulis dapat melakukan
                  perbaikan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                X
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Alasan Penolakan <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Tuliskan alasan penolakan..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <div className="mt-1 text-right text-xs text-slate-400">
                {rejectReason.length}/500
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={updating}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? "Mengirim..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
