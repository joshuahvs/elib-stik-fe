"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/app/lib/api";
import { fetchDigitalSignedUrl, openInNewTab } from "@/app/lib/booksDigital";
import { ajukanPeminjamanBuku } from "@/app/lib/peminjamanBuku";

type BookDetail = {
  id: string;
  title?: string | null;
  file_path?: string | null;
};

export default function BookDetailsPage() {
  const params = useParams<{ id: string }>();
  const idParam = (params as any)?.id as string | string[] | undefined;
  const bookId = Array.isArray(idParam) ? idParam[0] : idParam;

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<BookDetail | null>(null);

  useEffect(() => {
    setToken(window.localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token || !bookId) {
      setLoading(false);
      return;
    }

    const authToken = token;
    const stableBookId = bookId;

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);
        setBook(null);

        const res = await fetch(
          `${API_URL}/books/${encodeURIComponent(stableBookId)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            (data as any)?.message ??
            (data as any)?.error ??
            "Gagal mengambil detail buku";
          throw new Error(msg);
        }

        if (!cancelled) setBook(data as BookDetail);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Gagal memuat detail buku";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, bookId]);

  const title = useMemo(() => {
    return book?.title?.trim() || `Buku ${bookId ?? ""}`;
  }, [book?.title, bookId]);

  // Untuk backend kamu: digital ID = folder name di bucket (contoh: 'sample').
  // Default-nya pakai `bookId`.
  const digitalId = bookId;

  const [opening, setOpening] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanMessage, setLoanMessage] = useState<string | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [tanggalPinjam, setTanggalPinjam] = useState<string>("");
  const [periodeHari, setPeriodeHari] = useState<number>(7);

  const numericBukuId = useMemo(() => {
    const raw = bookId ?? (book as any)?.id;
    if (raw == null) return null;
    const n = typeof raw === "number" ? raw : Number(String(raw));
    if (!Number.isFinite(n)) return null;
    const intVal = Math.trunc(n);
    return intVal >= 1 ? intVal : null;
  }, [bookId, (book as any)?.id]);

  const akhirPinjam = useMemo(() => {
    if (!tanggalPinjam) return "";
    const days = Number.isFinite(periodeHari) ? Math.trunc(periodeHari) : 0;
    if (days <= 0) return "";

    // Build date in local time to avoid timezone shifting from ISO.
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

  async function handleOpenDigital() {
    if (!digitalId) return;
    const t = window.localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }

    try {
      setOpening(true);
      const { signedUrl } = await fetchDigitalSignedUrl({
        token: t,
        bookId: digitalId,
      });
      openInNewTab(signedUrl);
    } catch (e) {
      const msg = "Buku Digital Belum Tersedia";
      alert(msg);
    } finally {
      setOpening(false);
    }
  }

  async function handleAjukanPeminjaman() {
    const t = window.localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }

    if (!numericBukuId) {
      alert("ID buku tidak valid untuk pengajuan peminjaman.");
      return;
    }

    if (!tanggalPinjam || !akhirPinjam) {
      setLoanMessage(
        "Silakan pilih tanggal peminjaman dan periode peminjaman.",
      );
      return;
    }

    try {
      setSubmittingLoan(true);
      setLoanMessage(null);
      await ajukanPeminjamanBuku({
        token: t,
        bukuId: numericBukuId,
        tanggal_peminjaman: tanggalPinjam,
        akhir_peminjaman: akhirPinjam,
      });
      setLoanMessage("Pengajuan peminjaman berhasil dikirim.");
      setLoanModalOpen(false);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Gagal mengajukan peminjaman";
      setLoanMessage(msg);
    } finally {
      setSubmittingLoan(false);
    }
  }

  function openLoanModal() {
    const t = window.localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }
    if (!numericBukuId) {
      setLoanMessage("ID buku tidak valid untuk pengajuan peminjaman.");
      return;
    }

    // Initialize defaults when opening for nicer UX.
    if (!tanggalPinjam) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      setTanggalPinjam(`${yyyy}-${mm}-${dd}`);
    }
    if (!Number.isFinite(periodeHari) || periodeHari <= 0) {
      setPeriodeHari(7);
    }

    setLoanMessage(null);
    setLoanModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm underline text-slate-700">
            Kembali
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openLoanModal}
              disabled={!numericBukuId}
              className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-50 inline-flex items-center disabled:cursor-not-allowed disabled:opacity-60"
              title={!numericBukuId ? "ID buku tidak valid" : undefined}
            >
              Ajukan Peminjaman
            </button>

            {digitalId ? (
              <button
                type="button"
                onClick={handleOpenDigital}
                disabled={opening}
                className="h-10 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 inline-flex items-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {opening ? "Membuka…" : "Baca Digital"}
              </button>
            ) : null}
          </div>
        </div>

        {loanMessage ? (
          <div className="mt-4 text-sm text-slate-700">{loanMessage}</div>
        ) : null}

        {loanModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setLoanModalOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white border p-6 shadow-lg">
              <div className="text-lg font-semibold text-slate-900">
                Ajukan Peminjaman
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
                  onClick={() => setLoanModalOpen(false)}
                  disabled={submittingLoan}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAjukanPeminjaman}
                  disabled={submittingLoan || !numericBukuId}
                  className="h-10 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingLoan ? "Mengajukan…" : "Kirim Pengajuan"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!token && !loading ? (
          <div className="mt-8 rounded-2xl border p-6 text-slate-700">
            Kamu belum login. Silakan masuk dulu untuk melihat detail buku.
            <div className="mt-4">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {loading ? <div className="mt-8 text-slate-600">Memuat…</div> : null}

        {error && !loading ? (
          <div className="mt-8 rounded-2xl border p-6 text-slate-700">
            <div className="font-semibold text-slate-900">Gagal memuat</div>
            <div className="mt-2">{error}</div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
