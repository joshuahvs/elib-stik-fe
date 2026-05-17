"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  fetchSkripsiRepositoryDetail,
  fetchSkripsiRepositorySignedUrl,
  type SkripsiRow,
} from "@/app/lib/skripsi";

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

export default function SkripsiRepositoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [row, setRow] = useState<SkripsiRow | null>(null);
  const [error, setError] = useState<unknown>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(
          `/skripsi/repository/${id ?? ""}`,
        )}`,
      );
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
          if (!cancelled) setIsAllowed(false);
          return;
        }

        const data = await res.json().catch(() => null);
        const role = data?.role ?? data?.user?.role ?? data?.data?.role;
        const allowed = ["admin", "dosen", "mahasiswa"].includes(role ?? "");
        if (!cancelled) setIsAllowed(allowed);
      } catch {
        if (!cancelled) setIsAllowed(false);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();

    return () => {
      cancelled = true;
    };
  }, [router, id]);

  useEffect(() => {
    if (!id || !token || !isAllowed || meLoading) return;
    const authToken = token;
    const skripsiId = Array.isArray(id) ? id[0] : id;
    if (!skripsiId) return;

    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchSkripsiRepositoryDetail({
          token: authToken,
          id: skripsiId,
        });
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
  }, [id, token, isAllowed, meLoading]);

  useEffect(() => {
    if (!id || !token || !isAllowed || meLoading) return;
    const authToken = token;
    const skripsiId = Array.isArray(id) ? id[0] : id;
    if (!skripsiId) return;

    let cancelled = false;

    async function loadPreview() {
      setPreviewLoading(true);
      try {
        const res = await fetchSkripsiRepositorySignedUrl({
          token: authToken,
          id: skripsiId,
        });
        if (!cancelled) setPreviewUrl(res.signedUrl);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, "Gagal memuat preview"));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [id, token, isAllowed, meLoading]);

  const additionalAuthors = useMemo(
    () => parsePenulisTambahan(row?.penulis_tambahan),
    [row?.penulis_tambahan],
  );
  const previewSrc = previewUrl ? `${previewUrl}#toolbar=0&navpanes=0` : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/skripsi/repository"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-[#6b3a22] hover:text-[#6b3a22]"
          >
            Kembali ke Daftar
          </Link>
        </div>

        {!meLoading && token && !isAllowed ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Repositori Skripsi
            </h2>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya untuk admin, dosen, dan mahasiswa.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAllowed ? (
          <>
            <ErrorMessage error={error} className="mb-4" />

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              </div>
            ) : row ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h1 className="text-xl font-semibold text-slate-800">
                    {row.judul ?? "(Tanpa judul)"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    {getAuthorName(row)}
                  </p>

                  <div className="mt-6 space-y-4 text-sm">
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
                        Tahun
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {row.tahun ?? "-"}
                      </p>
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
                      {additionalAuthors.length === 0 ? (
                        <p className="mt-1 text-slate-700">-</p>
                      ) : (
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-700">
                          {additionalAuthors.map((p, idx) => (
                            <li key={`${p.nim}-${p.nama}-${idx}`}>
                              {p.nama} (NIM: {p.nim})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-800">
                      Preview Skripsi (Read Only)
                    </h2>
                    {previewLoading ? (
                      <span className="text-xs text-slate-400">Memuat...</span>
                    ) : null}
                  </div>

                  {previewSrc ? (
                    <iframe
                      src={previewSrc}
                      title="Preview Skripsi"
                      className="h-[75vh] w-full rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-[75vh] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                      Preview belum tersedia.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-700">
                  Skripsi tidak ditemukan.
                </p>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
