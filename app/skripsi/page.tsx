"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import {
  cancelSkripsi,
  fetchSkripsiMe,
  fetchSkripsiSignedUrl,
  fetchSkripsiTtdSignedUrl,
  getSkripsiUploadEligibility,
  type SkripsiRow,
} from "@/app/lib/skripsi";
import { openInNewTab } from "@/app/lib/booksDigital";

type SkripsiStatusUi = "Pending" | "Disetujui" | "Ditolak" | "Dibatalkan" | "-";

function toUiStatus(raw: any): SkripsiStatusUi {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  if (s === "DIBATALKAN") return "Dibatalkan";
  return "-";
}

function StatusPill({ status }: { status: SkripsiStatusUi }) {
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
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        className,
      ].join(" ")}
    >
      {status}
    </span>
  );
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
        // ignore parse error and fallback below
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

export default function SkripsiListPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<SkripsiRow[]>([]);
  const [error, setError] = useState<unknown>(null);

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingTtdId, setViewingTtdId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const uploadEligibility = useMemo(
    () => getSkripsiUploadEligibility(rows),
    [rows],
  );
  const uploadDisabled = isLoading || !uploadEligibility.allowed;

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      router.replace(`/auth/login?redirect=${encodeURIComponent("/skripsi")}`);
      return;
    }

    const authToken = t;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetchSkripsiMe({
          token: authToken,
          page: 1,
          limit: 50,
        });
        if (!cancelled) setRows(res.items);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(getErrorMessage(e, "Gagal mengambil daftar skripsi"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleViewPdf(id: string) {
    if (!token) return;

    setViewingId(id);
    setError(null);

    try {
      const res = await fetchSkripsiSignedUrl({ token, id });
      openInNewTab(res.signedUrl);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal membuka file PDF"));
    } finally {
      setViewingId(null);
    }
  }

  async function handleCancel(id: string) {
    if (!token) return;

    setCancellingId(id);
    setError(null);

    try {
      const updated = await cancelSkripsi({ token, id });
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e) {
      setError(getErrorMessage(e, "Gagal membatalkan pengajuan"));
    } finally {
      setCancellingId(null);
    }
  }

  async function handleViewTtd(id: string) {
    if (!token) return;

    setViewingTtdId(id);
    setError(null);

    try {
      const res = await fetchSkripsiTtdSignedUrl({ token, id });
      openInNewTab(res.signedUrl);
    } catch (e) {
      setError(getErrorMessage(e, "Gagal membuka file tanda tangan"));
    } finally {
      setViewingTtdId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#6b3a22]">
              Daftar Skripsi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Lihat dan pantau status pengajuan skripsi
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/skripsi/upload")}
            disabled={uploadDisabled}
            className={[
              "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold",
              "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white",
              uploadDisabled
                ? "cursor-not-allowed opacity-60"
                : "hover:opacity-95 active:scale-[0.99]",
            ].join(" ")}
          >
            Unggah Skripsi
          </button>
        </div>

        <ErrorMessage error={error} className="mb-4" />

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 gap-3 bg-[#6b3a22] px-5 py-3 text-sm font-semibold text-white sm:grid-cols-[1fr_160px_220px]">
            <div>Judul Skripsi</div>
            <div className="sm:text-center">Status</div>
            <div className="sm:text-center">Aksi</div>
          </div>

          {isLoading ? (
            <div className="p-6">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Belum ada skripsi yang diunggah
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Unggah skripsi untuk memulai pengajuan
              </p>
              <Link
                href="/skripsi/upload"
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#6b3a22] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Unggah Skripsi
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((row) => {
                const statusUi = toUiStatus(row.status);
                const isPending =
                  String(row.status ?? "").toUpperCase() === "PENDING";
                const penulisTambahan = parsePenulisTambahan(
                  row.penulis_tambahan,
                );

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_160px_220px] sm:items-center"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-800">
                        {row.judul ?? "(Tanpa judul)"}
                      </div>
                      <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-700">
                            Pembimbing:
                          </span>{" "}
                          {row.pembimbing?.trim() || "-"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">
                            Penguji:
                          </span>{" "}
                          {row.penguji?.trim() || "-"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">
                            Abstrak:
                          </span>{" "}
                          <span className="line-clamp-2">
                            {row.abstrak?.trim() || "-"}
                          </span>
                        </p>
                        <div>
                          <span className="font-semibold text-slate-700">
                            Penulis Tambahan:
                          </span>{" "}
                          {penulisTambahan.length === 0 ? (
                            <span>-</span>
                          ) : (
                            <ul className="mt-1 list-disc pl-4">
                              {penulisTambahan.map((p, i) => (
                                <li key={`${p.nim}-${p.nama}-${i}`}>
                                  {p.nama} (NIM: {p.nim})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-center">
                      <StatusPill status={statusUi} />
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-center">
                      <button
                        type="button"
                        onClick={() => handleViewPdf(row.id)}
                        disabled={
                          viewingId === row.id ||
                          viewingTtdId === row.id ||
                          cancellingId === row.id
                        }
                        className={[
                          "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold",
                          "border border-slate-300 text-slate-700 hover:bg-slate-50",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                        ].join(" ")}
                      >
                        {viewingId === row.id ? "Memuat..." : "Lihat PDF"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewTtd(row.id)}
                        disabled={
                          viewingTtdId === row.id ||
                          viewingId === row.id ||
                          cancellingId === row.id
                        }
                        className={[
                          "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold",
                          "border border-slate-300 text-slate-700 hover:bg-slate-50",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                        ].join(" ")}
                      >
                        {viewingTtdId === row.id
                          ? "Memuat..."
                          : "Lihat Tanda Tangan"}
                      </button>

                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleCancel(row.id)}
                          disabled={
                            cancellingId === row.id || viewingId === row.id
                          }
                          className={[
                            "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold",
                            "border border-rose-300 text-rose-700 hover:bg-rose-50",
                            "disabled:opacity-60 disabled:cursor-not-allowed",
                          ].join(" ")}
                        >
                          {cancellingId === row.id
                            ? "Membatalkan..."
                            : "Batalkan"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
