"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InputField from "@/app/components/InputField";
import ErrorMessage from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import { fetchBukuById } from "@/app/lib/koleksi";
import { updateAdminBook } from "@/app/lib/adminBooks";

const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' fill='%23f1f5f9'%3E%3Crect width='400' height='533'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='28' font-weight='700' dy='.3em'%3EImage Not Available%3C/text%3E%3C/svg%3E";

export default function EditBookPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [judul, setJudul] = useState("");
  const [namaOrang, setNamaOrang] = useState("");
  const [penerbit, setPenerbit] = useState("");
  const [tahunTerbit, setTahunTerbit] = useState("");
  const [jumlahEksemplar, setJumlahEksemplar] = useState("");
  const [subjek, setSubjek] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [sinopsis, setSinopsis] = useState("");
  const [urlSampul, setUrlSampul] = useState("");
  const [isbn, setIsbn] = useState("");
  const [bahasa, setBahasa] = useState("");

  const [loadingBook, setLoadingBook] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const t = window.localStorage.getItem("token");
    setToken(t);

    if (!t) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(`/admin/books/edit/${params.id}`)}`,
      );
      setMeLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMe() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
          cache: "no-store",
        });

        if (!res.ok) {
          window.localStorage.removeItem("token");
          router.replace(
            `/auth/login?redirect=${encodeURIComponent(`/admin/books/edit/${params.id}`)}`,
          );
          return;
        }

        const data = await res.json().catch(() => null);
        const role = data?.role ?? data?.user?.role ?? data?.data?.role;

        if (!cancelled) {
          setIsAdmin(String(role).toLowerCase() === "admin");
        }
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
  }, [params.id, router]);

  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;

    async function loadBook() {
      setLoadingBook(true);
      setError(null);

      try {
        const book = await fetchBukuById(params.id);

        if (!book) {
          setError("Buku tidak ditemukan");
          return;
        }

        if (!cancelled) {
          setJudul(String(book.judul ?? ""));
          setNamaOrang(String(book.nama_orang ?? ""));
          setPenerbit(String(book.penerbit ?? ""));
          setTahunTerbit(book.tahun_terbit ? String(book.tahun_terbit) : "");
          setJumlahEksemplar(
            book.jumlah_eksemplar != null ? String(book.jumlah_eksemplar) : "",
          );
          setSubjek(String(book.subjek ?? ""));
          setLokasi(String(book.lokasi ?? ""));
          setSinopsis(String(book.sinopsis ?? book.abstrak ?? ""));
          setUrlSampul(String(book.url_sampul ?? ""));
          setIsbn(String(book.isbn ?? book.issn_or_isbn ?? ""));
          setBahasa(String(book.bahasa ?? ""));
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoadingBook(false);
      }
    }

    loadBook();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const tahunError = useMemo(() => {
    const s = tahunTerbit.trim();
    if (!s) return "Tahun terbit wajib diisi";
    if (!/^\d{4}$/.test(s)) return "Tahun harus 4 digit";
    const n = Number(s);
    if (!Number.isFinite(n) || n < 1900) return "Tahun tidak valid";
    if (n > currentYear) return "Tahun tidak boleh lebih dari tahun ini";
    return null;
  }, [tahunTerbit, currentYear]);

  const jumlahError = useMemo(() => {
    const s = jumlahEksemplar.trim();
    if (!s) return "Jumlah eksemplar wajib diisi";
    if (!/^\d+$/.test(s)) return "Jumlah eksemplar harus angka bulat";
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return "Jumlah eksemplar tidak valid";
    return null;
  }, [jumlahEksemplar]);

  const disabled = submitting || meLoading || loadingBook || !isAdmin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(`/admin/books/edit/${params.id}`)}`,
      );
      return;
    }

    if (!isAdmin) {
      setError("Anda tidak memiliki akses untuk mengubah data buku.");
      return;
    }

    if (
      !judul.trim() ||
      !namaOrang.trim() ||
      !penerbit.trim() ||
      !subjek.trim() ||
      !lokasi.trim() ||
      !sinopsis.trim()
    ) {
      setError("Semua field wajib harus diisi.");
      return;
    }

    if (tahunError) {
      setError(tahunError);
      return;
    }

    if (jumlahError) {
      setError(jumlahError);
      return;
    }

    setSubmitting(true);

    try {
      await updateAdminBook({
        token,
        id: params.id,
        judul: judul.trim(),
        nama_orang: namaOrang.trim(),
        penerbit: penerbit.trim(),
        tahun_terbit: tahunTerbit.trim(),
        subjek: subjek.trim(),
        lokasi: lokasi.trim(),
        sinopsis: sinopsis.trim(),
        jumlah_eksemplar: jumlahEksemplar.trim(),
        url_sampul: urlSampul.trim() ? urlSampul.trim() : "",
        isbn: isbn.trim(),
        bahasa: bahasa.trim(),
      });

      setSuccess("Perubahan berhasil disimpan");

      setTimeout(() => {
        router.push(`/koleksi/${params.id}`);
      }, 900);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (meLoading || loadingBook) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <p className="text-sm text-slate-500">Memuat data buku...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <ErrorMessage error="Anda tidak memiliki akses ke halaman ini." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white px-8 py-4">
        <div className="text-sm text-slate-500">
          Beranda / Koleksi / {judul || "Detail Buku"} / Edit Buku
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-8 py-8">
        <button
          type="button"
          onClick={() => router.push(`/koleksi/${params.id}`)}
          className="mb-6 inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#6b3a22] hover:text-[#6b3a22]"
        >
          ← Kembali ke Detail Buku
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Edit Buku</h1>
          <p className="mt-1 text-sm text-slate-500">
            Perbarui informasi buku pada koleksi perpustakaan.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Judul Buku *"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                disabled={disabled}
              />

              <InputField
                label="Penulis *"
                value={namaOrang}
                onChange={(e) => setNamaOrang(e.target.value)}
                disabled={disabled}
              />

              <InputField label="Jenis Koleksi *" value="Buku" disabled />

              <InputField
                label="Penerbit *"
                value={penerbit}
                onChange={(e) => setPenerbit(e.target.value)}
                disabled={disabled}
              />

              <InputField
                label="Tahun Terbit *"
                value={tahunTerbit}
                onChange={(e) => setTahunTerbit(e.target.value)}
                disabled={disabled}
              />

              <InputField
                label="Jumlah Eksemplar *"
                value={jumlahEksemplar}
                onChange={(e) => setJumlahEksemplar(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="mt-5 space-y-5">
              <InputField
                label="Kategori *"
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                disabled={disabled}
              />

              <InputField
                label="Lokasi Rak *"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                disabled={disabled}
              />

              <div>
                <label className="mb-2 block text-sm text-black">
                  Sinopsis <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={sinopsis}
                  onChange={(e) => setSinopsis(e.target.value)}
                  disabled={disabled}
                  rows={5}
                  className="w-full rounded-lg border border-slate-900 bg-white p-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#733015] focus:outline-none focus:ring-2 focus:ring-[#733015]/20 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <InputField
                label="ISBN"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                disabled={disabled}
              />

              <InputField
                label="Bahasa"
                value={bahasa}
                onChange={(e) => setBahasa(e.target.value)}
                disabled={disabled}
              />

              <InputField
                label="URL Cover Buku (opsional)"
                value={urlSampul}
                onChange={(e) => setUrlSampul(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>

              <button
                type="button"
                onClick={() => router.push(`/koleksi/${params.id}`)}
                disabled={submitting}
                className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
            </div>

            <div className="mt-5">
              <ErrorMessage error={error} />
              {success ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  {success}
                </div>
              ) : null}
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <img
                src={urlSampul || FALLBACK_COVER}
                alt={judul || "Cover buku"}
                className="mx-auto aspect-[3/4] w-full max-w-[240px] rounded-xl object-cover shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_COVER;
                }}
              />
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center text-sm font-semibold text-green-700">
              • Tersedia
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
              <div className="flex justify-between gap-4 py-1">
                <span>ID Buku</span>
                <span className="font-semibold text-slate-900">
                  {params.id}
                </span>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span>Jenis Koleksi</span>
                <span className="font-semibold text-slate-900">Buku</span>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span>Jumlah Eksemplar</span>
                <span className="font-semibold text-slate-900">
                  {jumlahEksemplar || "-"}
                </span>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          Pastikan semua informasi yang diubah sudah benar sebelum menyimpan.
        </div>
      </section>
    </main>
  );
}
