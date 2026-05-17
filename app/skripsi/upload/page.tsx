"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "@/app/components/InputField";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  fetchSkripsiMe,
  getSkripsiUploadEligibility,
  SKRIPSI_MAX_FILE_BYTES,
  uploadSkripsi,
} from "@/app/lib/skripsi";

const MAX_FILE_BYTES = SKRIPSI_MAX_FILE_BYTES;

type AdditionalAuthor = {
  nim: string;
  nama: string;
};

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

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

function validatePdfFile(file: File | null, label: string): string | null {
  if (!file) return `${label} wajib diunggah`;

  const name = file.name?.toLowerCase?.() ?? "";
  const type = file.type?.toLowerCase?.() ?? "";

  const isPdf = type === "application/pdf" || name.endsWith(".pdf");
  if (!isPdf) return `${label} harus berupa PDF`;

  if (file.size <= 0) return `${label} tidak valid`;
  if (file.size > MAX_FILE_BYTES) return "Ukuran file maksimal 15MB";

  return null;
}

function buildUploadBlockedMessage(blockingStatus?: string): string {
  const s = String(blockingStatus ?? "")
    .trim()
    .toUpperCase();

  if (s === "PENDING") {
    return "Kamu sudah mengunggah skripsi dan statusnya masih Pending. Tombol unggah akan aktif setelah pengajuan dibatalkan.";
  }

  return "Mahasiswa hanya dapat mengunggah 1 skripsi (kecuali jika skripsi sebelumnya berstatus Dibatalkan atau Ditolak).";
}

export default function UploadSkripsiPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [meLoading, setMeLoading] = useState(true);

  const [judul, setJudul] = useState<string>("");
  const [tahun, setTahun] = useState<string>("");
  const [abstrak, setAbstrak] = useState<string>("");
  const [pembimbing, setPembimbing] = useState<string>("");
  const [penguji, setPenguji] = useState<string>("");
  const [penulisTambahan, setPenulisTambahan] = useState<AdditionalAuthor[]>([
    { nim: "", nama: "" },
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [fileTtd, setFileTtd] = useState<File | null>(null);

  const [dragActive, setDragActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityAllowed, setEligibilityAllowed] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(
    null,
  );

  const role =
    me?.role ?? me?.data?.role ?? me?.user?.role ?? (me?.profile?.role as any);

  const namaPenulis =
    pickFirstString(me, ["nama_lengkap", "nama", "full_name", "name"]) ??
    pickFirstString(me, ["username"]) ??
    "-";

  const nim = pickFirstString(me, ["nim"]) ?? "-";

  const canUpload = role === "mahasiswa";

  const uploadActionsDisabled =
    submitting ||
    meLoading ||
    !canUpload ||
    eligibilityLoading ||
    !eligibilityAllowed;

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent("/skripsi/upload")}`,
      );
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
              `/auth/login?redirect=${encodeURIComponent("/skripsi/upload")}`,
            );
          }
          return;
        }

        const data = await res.json().catch(() => null);
        if (!cancelled) setMe(data);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!token) return;
    if (meLoading) return;

    const authToken = token;

    if (!canUpload) {
      setEligibilityLoading(false);
      setEligibilityAllowed(false);
      setEligibilityMessage(null);
      return;
    }

    let cancelled = false;

    async function loadEligibility() {
      setEligibilityLoading(true);
      setEligibilityMessage(null);

      try {
        const res = await fetchSkripsiMe({
          token: authToken,
          page: 1,
          limit: 50,
        });
        const eligibility = getSkripsiUploadEligibility(res.items);

        if (cancelled) return;

        setEligibilityAllowed(eligibility.allowed);
        setEligibilityMessage(
          eligibility.allowed
            ? null
            : buildUploadBlockedMessage(eligibility.blockingStatus),
        );
      } catch (e) {
        if (cancelled) return;
        setEligibilityAllowed(false);
        setEligibilityMessage(
          getErrorMessage(e, "Gagal memeriksa status skripsi"),
        );
      } finally {
        if (!cancelled) setEligibilityLoading(false);
      }
    }

    loadEligibility();

    return () => {
      cancelled = true;
    };
  }, [token, meLoading, canUpload]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const tahunError = useMemo(() => {
    const s = tahun.trim();
    if (!s) return null;
    if (!/^\d{4}$/.test(s)) return "Tahun harus 4 digit (YYYY)";
    const n = Number(s);
    if (!Number.isFinite(n) || n < 1900) return "Tahun tidak valid";
    if (n > currentYear) return "Tahun tidak boleh lebih dari tahun ini";
    return null;
  }, [tahun, currentYear]);

  function onPickFile() {
    if (uploadActionsDisabled) return;
    fileInputRef.current?.click();
  }

  function onFileSelected(f: File | null) {
    const msg = validatePdfFile(f, "File skripsi");
    if (msg) {
      setError(msg);
      setFile(null);
      return;
    }

    setError(null);
    setFile(f);
  }

  function onFileTtdSelected(f: File | null) {
    const msg = validatePdfFile(f, "File TTD");
    if (msg) {
      setError(msg);
      setFileTtd(null);
      return;
    }

    setError(null);
    setFileTtd(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent("/skripsi/upload")}`,
      );
      return;
    }

    if (!canUpload) {
      setError("Hanya mahasiswa yang dapat mengunggah skripsi");
      return;
    }

    if (eligibilityLoading) {
      setError("Sedang memeriksa status skripsi, mohon tunggu sebentar");
      return;
    }

    if (!eligibilityAllowed) {
      setError(
        eligibilityMessage ??
          "Kamu tidak dapat mengunggah skripsi saat ini. Coba refresh halaman.",
      );
      return;
    }

    const judulTrim = judul.trim();
    const tahunTrim = tahun.trim();
    const abstrakTrim = abstrak.trim();
    const pembimbingTrim = pembimbing.trim();
    const pengujiTrim = penguji.trim();
    const penulisTambahanClean = penulisTambahan
      .map((v) => ({ nim: v.nim.trim(), nama: v.nama.trim() }))
      .filter((v) => v.nim.length > 0 || v.nama.length > 0);

    if (!judulTrim) return setError("Judul skripsi wajib diisi");
    if (!tahunTrim) return setError("Tahun wajib diisi");
    if (tahunError) return setError(tahunError);
    if (!abstrakTrim) return setError("Abstrak wajib diisi");

    for (const [idx, p] of penulisTambahanClean.entries()) {
      if (!p.nim || !p.nama) {
        return setError(
          `Penulis tambahan ke-${idx + 1} wajib mengisi NIM dan nama`,
        );
      }
    }

    const fileMsg = validatePdfFile(file, "File skripsi");
    if (fileMsg) return setError(fileMsg);
    const fileTtdMsg = validatePdfFile(fileTtd, "File TTD");
    if (fileTtdMsg) return setError(fileTtdMsg);

    setSubmitting(true);
    setError(null);

    try {
      await uploadSkripsi({
        token,
        judul: judulTrim,
        tahun: tahunTrim,
        abstrak: abstrakTrim,
        pembimbing: pembimbingTrim || undefined,
        penguji: pengujiTrim || undefined,
        penulis_tambahan: penulisTambahanClean,
        file: file as File,
        file_ttd: fileTtd as File,
      });

      router.push("/skripsi");
    } catch (e) {
      setError(getErrorMessage(e, "Gagal mengunggah skripsi"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#6b3a22]">
            Unggah Skripsi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Isi data skripsi dan unggah file PDF
          </p>
        </div>

        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#733015]">
            Informasi Skripsi
          </h2>

          {!meLoading && !canUpload ? (
            <ErrorMessage
              error={
                "Halaman ini khusus mahasiswa. Silakan masuk menggunakan akun mahasiswa."
              }
              className="mb-4"
            />
          ) : null}

          {!meLoading &&
          canUpload &&
          !eligibilityLoading &&
          !eligibilityAllowed ? (
            <ErrorMessage error={eligibilityMessage} className="mb-4" />
          ) : null}

          <ErrorMessage error={error} className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Nama Penulis"
                value={namaPenulis}
                readOnly
                disabled={meLoading}
              />
              <InputField
                label="NIM"
                value={nim}
                readOnly
                disabled={meLoading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-black">
                Judul Skripsi <span className="text-rose-600">*</span>
              </label>
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Masukkan judul skripsi"
                disabled={submitting || meLoading || !canUpload}
                className={[
                  "w-full p-3 border rounded-lg transition-colors",
                  "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                  "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                ].join(" ")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-black">
                Tahun <span className="text-rose-600">*</span>
              </label>
              <input
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                placeholder="YYYY"
                inputMode="numeric"
                maxLength={4}
                disabled={submitting || meLoading || !canUpload}
                className={[
                  "w-full p-3 border rounded-lg transition-colors",
                  "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                  "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                ].join(" ")}
              />
              {tahunError ? (
                <p className="mt-1 text-xs text-rose-600">{tahunError}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-black">
                Abstrak <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={abstrak}
                onChange={(e) => setAbstrak(e.target.value)}
                placeholder="Masukkan abstrak skripsi"
                rows={5}
                disabled={submitting || meLoading || !canUpload}
                className={[
                  "w-full p-3 border rounded-lg transition-colors",
                  "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                  "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                ].join(" ")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-black">
                  Pembimbing
                </label>
                <input
                  value={pembimbing}
                  onChange={(e) => setPembimbing(e.target.value)}
                  placeholder="Contoh: Dr. Budi Santoso"
                  disabled={submitting || meLoading || !canUpload}
                  className={[
                    "w-full p-3 border rounded-lg transition-colors",
                    "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                    "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                  ].join(" ")}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-black">Penguji</label>
                <input
                  value={penguji}
                  onChange={(e) => setPenguji(e.target.value)}
                  placeholder="Contoh: Prof. Susanto"
                  disabled={submitting || meLoading || !canUpload}
                  className={[
                    "w-full p-3 border rounded-lg transition-colors",
                    "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                    "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                  ].join(" ")}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-black">
                Penulis Tambahan
              </label>

              <div className="space-y-2">
                {penulisTambahan.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr_auto]"
                  >
                    <input
                      value={item.nim}
                      onChange={(e) => {
                        const next = [...penulisTambahan];
                        next[idx] = { ...next[idx], nim: e.target.value };
                        setPenulisTambahan(next);
                      }}
                      placeholder="NIM penulis tambahan"
                      disabled={submitting || meLoading || !canUpload}
                      className={[
                        "w-full p-3 border rounded-lg transition-colors",
                        "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                        "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                      ].join(" ")}
                    />
                    <input
                      value={item.nama}
                      onChange={(e) => {
                        const next = [...penulisTambahan];
                        next[idx] = { ...next[idx], nama: e.target.value };
                        setPenulisTambahan(next);
                      }}
                      placeholder="Nama penulis tambahan"
                      disabled={submitting || meLoading || !canUpload}
                      className={[
                        "w-full p-3 border rounded-lg transition-colors",
                        "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
                        "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
                      ].join(" ")}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (penulisTambahan.length <= 1) {
                          setPenulisTambahan([{ nim: "", nama: "" }]);
                          return;
                        }
                        setPenulisTambahan((prev) =>
                          prev.filter((_, i) => i !== idx),
                        );
                      }}
                      disabled={submitting || meLoading || !canUpload}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPenulisTambahan((prev) => [...prev, { nim: "", nama: "" }])
                }
                disabled={submitting || meLoading || !canUpload}
                className="mt-2 inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                + Tambah Penulis
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm text-black">
                Upload File Skripsi (PDF){" "}
                <span className="text-rose-600">*</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
                disabled={uploadActionsDisabled}
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
                  if (uploadActionsDisabled) return;
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (uploadActionsDisabled) return;
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (uploadActionsDisabled) return;
                  const f = e.dataTransfer.files?.[0] ?? null;
                  onFileSelected(f);
                }}
                className={[
                  "w-full rounded-xl border-2 border-dashed p-8 text-center transition",
                  dragActive
                    ? "border-[#733015] bg-[#733015]/5"
                    : "border-slate-200 bg-white",
                  uploadActionsDisabled
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer hover:border-[#733015]/60",
                ].join(" ")}
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                {!file ? (
                  <>
                    <p className="text-sm font-medium text-slate-700">
                      Klik atau drag file PDF
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Maksimal ukuran file 15MB
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

            <div>
              <label className="mb-2 block text-sm text-black">
                Upload File TTD (PDF) <span className="text-rose-600">*</span>
              </label>

              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => onFileTtdSelected(e.target.files?.[0] ?? null)}
                disabled={uploadActionsDisabled}
                className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {fileTtd ? (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {fileTtd.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(fileTtd.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-rose-700 hover:text-rose-800"
                    onClick={() => {
                      if (submitting) return;
                      setFileTtd(null);
                    }}
                  >
                    Hapus file
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploadActionsDisabled}
                className={[
                  "inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold",
                  "bg-gradient-to-r from-[#733015] to-[#8b5529] text-white",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {submitting ? "Mengunggah..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
