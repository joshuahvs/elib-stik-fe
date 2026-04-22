"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "@/app/components/InputField";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  ADMIN_BOOK_MAX_FILE_BYTES,
  createAdminBook,
} from "@/app/lib/adminBooks";

const MAX_FILE_BYTES = ADMIN_BOOK_MAX_FILE_BYTES;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let idx = 0;
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024;
    idx += 1;
  }
  return `${n.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function validatePdfFile(file: File | null): string | null {
  if (!file) return "File buku wajib diunggah";

  const name = file.name?.toLowerCase?.() ?? "";
  const type = file.type?.toLowerCase?.() ?? "";
  const isPdf = type === "application/pdf" || name.endsWith(".pdf");
  if (!isPdf) return "File buku harus berupa PDF";

  if (file.size <= 0) return "File buku tidak valid";
  if (file.size > MAX_FILE_BYTES) return "Ukuran file maksimal 20MB";

  return null;
}

export default function AdminAddBookPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [judul, setJudul] = useState("");
  const [namaOrang, setNamaOrang] = useState("");
  const [penerbit, setPenerbit] = useState("");
  const [tahunTerbit, setTahunTerbit] = useState("");
  const [subjek, setSubjek] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [sinopsis, setSinopsis] = useState("");
  const [jumlahEksemplar, setJumlahEksemplar] = useState("");
  const [urlSampul, setUrlSampul] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [dragActive, setDragActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent("/admin/books")}`,
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
          if (!cancelled) {
            router.replace(
              `/auth/login?redirect=${encodeURIComponent("/admin/books")}`,
            );
          }
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
  }, [router]);

  const tahunError = useMemo(() => {
    const s = tahunTerbit.trim();
    if (!s) return null;
    if (!/^\d{4}$/.test(s)) return "Tahun harus 4 digit (YYYY)";
    const n = Number(s);
    if (!Number.isFinite(n) || n < 1900 || n > 2100) return "Tahun tidak valid";
    return null;
  }, [tahunTerbit]);

  const jumlahEksemplarError = useMemo(() => {
    const s = jumlahEksemplar.trim();
    if (!s) return null;
    if (!/^\d+$/.test(s)) return "Jumlah eksemplar harus angka bulat";
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return "Jumlah eksemplar tidak valid";
    return null;
  }, [jumlahEksemplar]);

  const disabled = submitting || meLoading || !isAdmin;

  function onPickFile() {
    if (disabled) return;
    fileInputRef.current?.click();
  }

  function onFileSelected(f: File | null) {
    const msg = validatePdfFile(f);
    if (msg) {
      setError(msg);
      setFile(null);
      return;
    }

    setError(null);
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);

    if (!token) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent("/admin/books")}`,
      );
      return;
    }

    if (!isAdmin) {
      setError("Hanya admin yang dapat menambahkan buku");
      return;
    }

    const judulTrim = judul.trim();
    const namaTrim = namaOrang.trim();
    const tahunTrim = tahunTerbit.trim();
    const jumlahTrim = jumlahEksemplar.trim();

    if (!judulTrim) return setError("Judul buku wajib diisi");
    if (!namaTrim) return setError("Penulis wajib diisi");
    if (tahunError) return setError(tahunError);
    if (jumlahEksemplarError) return setError(jumlahEksemplarError);

    const fileMsg = validatePdfFile(file);
    if (fileMsg) return setError(fileMsg);

    try {
      setSubmitting(true);
      setError(null);

      const res = await createAdminBook({
        token,
        judul: judulTrim,
        nama_orang: namaTrim,
        penerbit,
        tahun_terbit: tahunTrim || undefined,
        subjek,
        lokasi,
        sinopsis,
        jumlah_eksemplar: jumlahTrim || undefined,
        url_sampul: urlSampul,
        file: file as File,
      });

      const newId = res?.data?.id;

      setSuccess("Buku berhasil ditambahkan.");
      setJudul("");
      setNamaOrang("");
      setPenerbit("");
      setTahunTerbit("");
      setSubjek("");
      setLokasi("");
      setSinopsis("");
      setJumlahEksemplar("");
      setUrlSampul("");
      setFile(null);

      if (newId != null) {
        router.push(`/koleksi/${encodeURIComponent(String(newId))}`);
      }
    } catch (e) {
      setError(getErrorMessage(e, "Gagal menambahkan buku"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#6b3a22]">
            Tambah Buku
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tambahkan buku baru dan unggah file PDF
          </p>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {!meLoading && !isAdmin ? (
            <ErrorMessage
              error={
                "Halaman ini khusus admin. Silakan masuk menggunakan akun admin."
              }
              className="mb-4"
            />
          ) : null}

          <ErrorMessage error={error} className="mb-4" />
          {success ? (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Judul Buku"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Masukkan judul buku"
                disabled={disabled}
              />
              <InputField
                label="Penulis"
                value={namaOrang}
                onChange={(e) => setNamaOrang(e.target.value)}
                placeholder="Masukkan nama penulis"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Penerbit"
                value={penerbit}
                onChange={(e) => setPenerbit(e.target.value)}
                placeholder="Masukkan penerbit"
                disabled={disabled}
              />
              <div>
                <InputField
                  label="Tahun Terbit"
                  value={tahunTerbit}
                  onChange={(e) => setTahunTerbit(e.target.value)}
                  placeholder="YYYY"
                  inputMode="numeric"
                  maxLength={4}
                  disabled={disabled}
                />
                {tahunError ? (
                  <p className="mt-1 text-xs text-rose-600">{tahunError}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Kategori"
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                placeholder="Contoh: Hukum, Teknologi"
                disabled={disabled}
              />
              <InputField
                label="Lokasi Rak"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Rak A1"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <InputField
                  label="Jumlah Eksemplar"
                  value={jumlahEksemplar}
                  onChange={(e) => setJumlahEksemplar(e.target.value)}
                  placeholder="Contoh: 10"
                  inputMode="numeric"
                  disabled={disabled}
                />
                {jumlahEksemplarError ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {jumlahEksemplarError}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-black">Sinopsis</label>
              <textarea
                value={sinopsis}
                onChange={(e) => setSinopsis(e.target.value)}
                placeholder="Masukkan sinopsis buku"
                rows={4}
                disabled={disabled}
                className={[
                  "w-full rounded-lg border p-3 transition-colors",
                  "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                  "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                ].join(" ")}
              />
            </div>

            <InputField
              label="URL Sampul (opsional)"
              value={urlSampul}
              onChange={(e) => setUrlSampul(e.target.value)}
              placeholder="https://..."
              disabled={disabled}
            />

            <div>
              <label className="mb-2 block text-sm text-black">
                Upload File Buku (PDF) <span className="text-rose-600">*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
                disabled={disabled}
              />

              <div
                role="button"
                tabIndex={0}
                onClick={onPickFile}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPickFile();
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (disabled) return;
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (disabled) return;
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (disabled) return;
                  const f = e.dataTransfer.files?.[0] ?? null;
                  onFileSelected(f);
                }}
                className={[
                  "w-full rounded-xl border-2 border-dashed p-8 text-center transition",
                  dragActive
                    ? "border-[#733015] bg-[#733015]/5"
                    : "border-slate-200 bg-white",
                  disabled
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer hover:border-[#733015]/60",
                ].join(" ")}
              >
                {!file ? (
                  <>
                    <p className="text-sm font-medium text-slate-700">
                      Klik atau drag file PDF
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Maksimal ukuran file {formatBytes(MAX_FILE_BYTES)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatBytes(file.size)}
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-medium text-rose-700 hover:text-rose-800"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (submitting) return;
                        setFile(null);
                      }}
                    >
                      Hapus file
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={disabled}
                className={[
                  "inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold",
                  "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "Menyimpan..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}