"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchBukuById, type BukuRow } from "@/app/lib/koleksi";
import { API_URL } from "@/app/lib/api";
import { fetchDigitalSignedUrl, openInNewTab } from "@/app/lib/booksDigital";
import { ajukanPeminjamanBuku } from "@/app/lib/peminjamanBuku";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { fetchMe } from "@/app/lib/me";
import { archiveAdminBook } from "@/app/lib/adminBooks";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookDigitalMeta = {
  id?: string | number | null;
  title?: string | null;
  file_path?: string | null;
};

type Review = {
  id: number;
  user_name: string;
  role?: string;
  rating: number;
  comment: string;
  created_at: string;
  is_owner?: boolean;
  is_admin?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatLocalYmd = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const cleanText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.replace(/[\[\]'"]/g, "").trim();
};

const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533' fill='%23f1f5f9'%3E%3Crect width='400' height='533'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='48' font-weight='700' dy='.3em'%3EImage Not%3C/text%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='48' font-weight='700' dy='.3em'%3EAvailable%3C/text%3E%3C/svg%3E";

// ─── Star display ─────────────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ${i < rating ? "text-orange-400" : "text-slate-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Star picker (interactive) ────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-7 w-7 transition-colors ${star <= (hovered || value) ? "text-orange-400" : "text-slate-200"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KoleksiDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Book
  const [book, setBook] = useState<BukuRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const todayYmd = useMemo(() => formatLocalYmd(new Date()), []);

  // Digital
  const [token, setToken] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [digitalMeta, setDigitalMeta] = useState<BookDigitalMeta | null>(null);
  const [opening, setOpening] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [digitalPreviewOpen, setDigitalPreviewOpen] = useState(false);
  const [digitalPreviewUrl, setDigitalPreviewUrl] = useState<string | null>(
    null,
  );
  const [digitalPreviewBlobUrl, setDigitalPreviewBlobUrl] = useState<
    string | null
  >(null);
  const [digitalPreviewLoading, setDigitalPreviewLoading] = useState(false);
  const [digitalPreviewError, setDigitalPreviewError] = useState<string | null>(
    null,
  );

  // Loan
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanPageError, setLoanPageError] = useState<string | null>(null);
  const [loanModalError, setLoanModalError] = useState<string | null>(null);
  const [loanSuccess, setLoanSuccess] = useState<string | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [tanggalPinjam, setTanggalPinjam] = useState<string>("");
  const [periodeHari, setPeriodeHari] = useState<number>(7);

  // Reviews (PBI-32 ~ PBI-36)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  console.log("REVIEWS:", reviews);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    fetchBukuById(params.id)
      .then((data) => {
        setBook(data);
        if (!data) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  useEffect(() => {
    setToken(window.localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      return;
    }

    fetchMe(token)
      .then((me) => {
        setIsAdmin(String(me.role).toLowerCase() === "admin");
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !params.id) {
      setDigitalMeta(null);
      return;
    }
    const authToken = token;
    const stableId = params.id;
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(
          `${API_URL}/books/${encodeURIComponent(stableId)}`,
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
          if (!cancelled) setDigitalMeta(null);
          return;
        }
        if (!cancelled)
          setDigitalMeta((data ?? null) as BookDigitalMeta | null);
      } catch {
        if (!cancelled) setDigitalMeta(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, params.id]);

  useEffect(() => {
    if (!params.id) return;

    loadReviews();
  }, [params.id]);

  useEffect(() => {
    return () => {
      if (digitalPreviewBlobUrl) {
        URL.revokeObjectURL(digitalPreviewBlobUrl);
      }
    };
  }, [digitalPreviewBlobUrl]);

  // PBI-32 — load reviews
  const loadReviews = async () => {
    if (!params.id) return;

    const t = localStorage.getItem("token");

    try {
      setReviewLoading(true);

      const res = await fetch(`${API_URL}/reviews/${params.id}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });

      const data = await res.json();

      console.log("REVIEWS DATA:", data); // debug

      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Memos ─────────────────────────────────────────────────────────────────

  const numericBukuId = useMemo(() => {
    const raw = book?.id ?? params.id;
    if (raw == null) return null;
    const n = typeof raw === "number" ? raw : Number(String(raw));
    if (!Number.isFinite(n)) return null;
    const intVal = Math.trunc(n);
    return intVal >= 1 ? intVal : null;
  }, [book?.id, params.id]);

  const digitalId = useMemo(
    () => (params.id ? String(params.id) : null),
    [params.id],
  );

  const hasDigital = useMemo(() => {
    const fp = book?.file_path ?? book?.filePath ?? digitalMeta?.file_path;
    return typeof fp === "string" && fp.trim().length > 0;
  }, [book?.file_path, book?.filePath, digitalMeta?.file_path]);

  const digitalPreviewSrc = useMemo(() => {
    if (!digitalPreviewBlobUrl) return null;
    return `${digitalPreviewBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`;
  }, [digitalPreviewBlobUrl]);

  const akhirPinjam = useMemo(() => {
    if (!tanggalPinjam) return "";
    const days = Number.isFinite(periodeHari) ? Math.trunc(periodeHari) : 0;
    if (days <= 0) return "";
    const [y, m, d] = tanggalPinjam.split("-").map(Number);
    if (!y || !m || !d) return "";
    const start = new Date(y, m - 1, d);
    if (Number.isNaN(start.getTime())) return "";
    const end = new Date(start);
    end.setDate(start.getDate() + days);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  }, [tanggalPinjam, periodeHari]);

  // PBI-36 — avg & distribution
  const avgRating = useMemo(() => {
    if (!reviews.length) return "0.0";
    return (
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    ).toFixed(1);
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    });
    return dist;
  }, [reviews]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleOpenDigital() {
    if (!digitalId) return;
    const t = window.localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      setOpening(true);
      setDigitalPreviewLoading(true);
      setDigitalPreviewOpen(true);
      setDigitalPreviewUrl(null);
      setDigitalPreviewBlobUrl(null);
      setDigitalPreviewError(null);
      setPageError(null);
      const { signedUrl } = await fetchDigitalSignedUrl({
        token: t,
        bookId: digitalId,
      });
      setDigitalPreviewUrl(signedUrl);

      try {
        const res = await fetch(signedUrl, { method: "GET" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Gagal memuat file digital (${res.status})`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        const buffer = await res.arrayBuffer();
        if (!buffer || buffer.byteLength === 0) {
          throw new Error("File digital kosong atau tidak dapat dibaca");
        }
        const blob = new Blob([buffer], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        setDigitalPreviewBlobUrl(blobUrl);
        if (!contentType.toLowerCase().includes("pdf")) {
          setDigitalPreviewError(
            "File digital tidak terdeteksi sebagai PDF. Jika preview kosong, buka di tab baru.",
          );
        }
      } catch (e) {
        setDigitalPreviewError(
          getErrorMessage(
            e,
            "Preview tidak dapat dimuat di halaman ini. Silakan buka di tab baru.",
          ),
        );
      }
    } catch (e) {
      closeDigitalPreview();
      setPageError(getErrorMessage(e, "Buku Digital Belum Tersedia"));
    } finally {
      setOpening(false);
      setDigitalPreviewLoading(false);
    }
  }

  function closeDigitalPreview() {
    setDigitalPreviewOpen(false);
    setDigitalPreviewUrl(null);
    setDigitalPreviewBlobUrl(null);
    setDigitalPreviewLoading(false);
    setDigitalPreviewError(null);
  }

  function openLoanModal() {
    const t = window.localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }
    if (!numericBukuId) {
      setLoanPageError("ID buku tidak valid.");
      setLoanSuccess(null);
      return;
    }
    if (!tanggalPinjam) setTanggalPinjam(todayYmd);
    if (!Number.isFinite(periodeHari) || periodeHari <= 0) setPeriodeHari(7);
    setLoanPageError(null);
    setLoanModalError(null);
    setLoanSuccess(null);
    setLoanModalOpen(true);
  }

  async function handleAjukanPeminjaman() {
    const t = window.localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }
    if (!numericBukuId) {
      setLoanModalError("ID buku tidak valid.");
      return;
    }
    if (!tanggalPinjam || !akhirPinjam) {
      setLoanModalError("Pilih tanggal dan periode peminjaman.");
      return;
    }
    if (tanggalPinjam < formatLocalYmd(new Date())) {
      setLoanModalError("Tanggal tidak boleh di masa lalu.");
      return;
    }
    try {
      setSubmittingLoan(true);
      setLoanModalError(null);
      setLoanPageError(null);
      setLoanSuccess(null);
      await ajukanPeminjamanBuku({
        token: t,
        bukuId: numericBukuId,
        tanggal_peminjaman: tanggalPinjam,
        akhir_peminjaman: akhirPinjam,
      });
      setLoanSuccess("Pengajuan peminjaman berhasil dikirim.");
      setLoanModalOpen(false);
    } catch (e) {
      setLoanModalError(getErrorMessage(e, "Gagal mengajukan peminjaman"));
    } finally {
      setSubmittingLoan(false);
    }
  }

  // PBI-33 & PBI-34 — add / edit review
  async function handleSubmitReview() {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }
    if (!commentInput.trim()) {
      setReviewError("Komentar tidak boleh kosong.");
      return;
    }
    try {
      setReviewSubmitting(true);
      setReviewError(null);
      const method = editingReview ? "PUT" : "POST";
      const url = editingReview
        ? `${API_URL}/reviews/${editingReview.id}`
        : `${API_URL}/reviews`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          buku_id: Number(params.id),
          rating: ratingInput,
          comment: commentInput,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setReviewModalOpen(false);
      setEditingReview(null);
      setRatingInput(5);
      setCommentInput("");
      await loadReviews();
    } catch (e) {
      setReviewError(
        e instanceof Error ? e.message : "Gagal menyimpan ulasan.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  // PBI-35 — delete review
  async function handleDeleteReview(id: number) {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      const res = await fetch(`${API_URL}/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) throw new Error();
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* optionally show error */
    } finally {
      setDeleteConfirmId(null);
    }
  }

  function openAddReviewModal() {
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/auth/login";
      return;
    }
    setEditingReview(null);
    setRatingInput(5);
    setCommentInput("");
    setReviewError(null);
    setReviewModalOpen(true);
  }

  function openEditReviewModal(r: Review) {
    setEditingReview(r);
    setRatingInput(r.rating);
    setCommentInput(r.comment);
    setReviewError(null);
    setReviewModalOpen(true);
  }

  async function handleArchiveBook() {
    const token = window.localStorage.getItem("token");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      setArchiving(true);
      setPageError(null);

      await archiveAdminBook({
        token,
        id: params.id,
      });

      setShowArchiveModal(false);
      alert("Buku berhasil dipindahkan ke arsip");
      router.push("/koleksi");
    } catch (e) {
      setPageError(getErrorMessage(e, "Gagal menghapus buku"));
    } finally {
      setArchiving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3 text-sm text-slate-500">
          <a href="/" className="transition hover:text-[#6b3a22]">
            Beranda
          </a>
          <span>/</span>
          <a href="/koleksi" className="transition hover:text-[#6b3a22]">
            Koleksi
          </a>
          <span>/</span>
          <span className="line-clamp-1 text-slate-700">
            {cleanText(book?.judul) || "Detail"}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.push("/koleksi")}
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-[#6b3a22] hover:text-[#6b3a22]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali ke Koleksi
        </button>

        <ErrorMessage error={pageError} className="mb-6" />
        <ErrorMessage error={loanPageError} className="mb-6" />
        {loanSuccess && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {loanSuccess}
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="w-full shrink-0 md:w-72">
              <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-slate-200" />
            </div>
            <div className="flex-1 space-y-4 pt-2">
              <div className="h-7 w-2/3 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-6 grid grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Not found */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-24 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-4 h-14 w-14 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-base font-semibold text-slate-600">
              Buku tidak ditemukan
            </p>
            <p className="mt-1 text-sm">ID yang diminta tidak tersedia.</p>
          </div>
        )}

        {/* ── Book detail ─────────────────────────────────────────────────────── */}
        {!isLoading && book && (
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            {/* Cover */}
            <div className="w-full shrink-0 md:w-72">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
                <img
                  src={cleanText(book.url_sampul) || FALLBACK_COVER}
                  alt={book.judul ?? "Cover buku"}
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = FALLBACK_COVER;
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-700">
                  Tersedia
                </span>
              </div>
              {book.no_panggil && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                    No. Panggil
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-slate-700">
                    {cleanText(book.no_panggil)}
                  </p>
                </div>
              )}
              {/* PBI-36 — rating card */}
              {reviews.length > 0 && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                    Rating
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-800">
                    {avgRating}
                  </p>
                  <div className="mt-1 flex justify-center">
                    <StarRating rating={Math.round(Number(avgRating))} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {reviews.length} ulasan
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {cleanText(book.subjek) && (
                  <span className="rounded-full bg-[#6b3a22]/10 px-3 py-0.5 text-xs font-semibold text-[#6b3a22]">
                    {cleanText(book.subjek)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold leading-snug text-slate-800">
                {cleanText(book.judul) || "Tanpa Judul"}
              </h1>
              <p className="mt-1 text-base text-slate-500">
                {cleanText(book.nama_orang) || "Penulis tidak diketahui"}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={openLoanModal}
                    disabled={!numericBukuId}
                    className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#6b3a22] hover:text-[#6b3a22] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Ajukan Peminjaman
                  </button>

                  {hasDigital ? (
                    <button
                      type="button"
                      onClick={handleOpenDigital}
                      disabled={opening}
                      className="inline-flex h-10 items-center rounded-lg bg-[#6b3a22] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {opening ? "Membuka…" : "Baca Digital"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-10 cursor-not-allowed items-center rounded-lg bg-[#6b3a22] px-4 text-sm font-semibold text-white opacity-60 shadow-sm"
                    >
                      Buku Digital Belum Tersedia
                    </button>
                  )}
                </div>

                {isAdmin &&
                  String(book?.jenis_koleksi ?? "").toLowerCase() ===
                    "buku" && (
                  String(book?.jenis_koleksi ?? "").toLowerCase() ===
                    "buku" && (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/books/edit/${params.id}`)
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.651-1.651a2.121 2.121 0 013 3L7.5 19.849 3 21l1.151-4.5L16.862 4.487z"
                          />
                        </svg>
                        Perbarui Buku
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/books/edit/${params.id}`)
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.651-1.651a2.121 2.121 0 013 3L7.5 19.849 3 21l1.151-4.5L16.862 4.487z"
                          />
                        </svg>
                        Perbarui Buku
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowArchiveModal(true)}
                        disabled={archiving}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3m-9 0h12"
                          />
                        </svg>
                        {archiving ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  )}
                      <button
                        type="button"
                        onClick={() => setShowArchiveModal(true)}
                        disabled={archiving}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3m-9 0h12"
                          />
                        </svg>
                        {archiving ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  )}
              </div>

              <hr className="my-6 border-slate-200" />

              <dl className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                <DetailItem
                  label="Jenis Koleksi"
                  value={cleanText(book.jenis_koleksi)}
                />
                <DetailItem label="Penerbit" value={cleanText(book.penerbit)} />
                <DetailItem
                  label="Tahun Terbit"
                  value={book.tahun_terbit?.toString()}
                />
                <DetailItem
                  label="Jumlah Eksemplar"
                  value={
                    typeof book.jumlah_eksemplar === "number"
                      ? String(book.jumlah_eksemplar)
                      : cleanText(book.jumlah_eksemplar as any)
                  }
                />
                <DetailItem label="ISBN" value={cleanText(book.isbn)} />
                <DetailItem
                  label="ISSN"
                  value={cleanText(book.issn ?? book.issn_or_isbn)}
                />
                <DetailItem label="Edisi" value={cleanText(book.edisi)} />
                <DetailItem
                  label="Bahasa"
                  value={cleanText(book.bahasa ?? book.kode_bahasa)}
                />
                <DetailItem
                  label="Tempat Terbit"
                  value={cleanText(book.tempat_terbit)}
                />
                <DetailItem
                  label="Lembaga Pemilik"
                  value={cleanText(book.lembaga_pemilik)}
                />
                <DetailItem
                  label="Sumber"
                  value={cleanText(
                    book.sumber ?? book.sumber_data ?? book.sumber_koleksi,
                  )}
                />
                <DetailItem label="Volume" value={cleanText(book.volume)} />
                <DetailItem
                  label="Deskripsi Fisik"
                  value={cleanText(book.deskripsi_fisik)}
                />
                <DetailItem
                  label="Catatan Umum"
                  value={cleanText(book.catatan_umum)}
                />
                <DetailItem
                  label="Nama Badan"
                  value={cleanText(book.nama_badan)}
                />
                <DetailItem
                  label="Nama Orang Tambahan"
                  value={cleanText(book.nama_orang_tambahan)}
                />
                <DetailItem
                  label="Kata Kunci"
                  value={cleanText(book.kata_kunci)}
                />
                <DetailItem label="Abstrak" value={cleanText(book.abstrak)} />
                <DetailItem label="Sinopsis" value={cleanText(book.sinopsis)} />
                <DetailItem
                  label="Frekuensi Terbit"
                  value={cleanText(book.frekuensi_terbit)}
                />
                <DetailItem
                  label="Penerbitan"
                  value={cleanText(book.penerbitan)}
                />
                <DetailItem label="Barcode" value={cleanText(book.barcode)} />
              </dl>

              {book.lokasi && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#6b3a22]/20 bg-[#6b3a22]/5 px-4 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 shrink-0 text-[#6b3a22]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#6b3a22]/60">
                      Lokasi Rak
                    </p>
                    <p className="text-sm font-semibold text-[#6b3a22]">
                      {cleanText(book.lokasi)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PBI-32 : Ulasan Pembaca ──────────────────────────────────────────── */}
        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Ulasan Pembaca</h2>
            {/* PBI-33 */}
            <button
              onClick={openAddReviewModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6b3a22] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tulis Ulasan
            </button>
          </div>

          {/* PBI-36 — summary */}
          {reviews.length > 0 && (
            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center sm:w-28">
                <span className="text-5xl font-bold text-slate-800">
                  {avgRating}
                </span>
                <StarRating rating={Math.round(Number(avgRating))} />
                <span className="mt-1 text-xs text-slate-400">
                  {reviews.length} ulasan
                </span>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star - 1];
                  const pct = reviews.length
                    ? (count / reviews.length) * 100
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-right text-slate-500">
                        {star}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 shrink-0 text-orange-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-orange-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-xs text-slate-400">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List */}
          {reviewLoading ? (
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-slate-200"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-3 h-10 w-10 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-sm font-medium">Belum ada ulasan</p>
              <p className="mt-0.5 text-xs">
                Jadilah yang pertama memberikan ulasan!
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6b3a22]/10 text-sm font-bold text-[#6b3a22]">
                        {r.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {r.user_name}
                        </p>
                        <p className="text-xs text-slate-400">{r.created_at}</p>
                      </div>
                    </div>
                    {/* PBI-34 & PBI-35 */}
                    {(r.is_owner || r.is_admin) && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => openEditReviewModal(r)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#6b3a22] hover:text-[#6b3a22]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(r.id)}
                          className="rounded-lg border border-red-100 px-2.5 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <StarRating rating={r.rating} />
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {r.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Modal Peminjaman ─────────────────────────────────────────────────── */}
        {loanModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setLoanModalOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="text-lg font-semibold text-slate-900">
                Ajukan Peminjaman
              </div>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-700">
                    Tanggal Peminjaman
                  </label>
                  <input
                    type="date"
                    min={todayYmd}
                    value={tanggalPinjam}
                    onChange={(e) => {
                      const next = e.target.value;
                      setTanggalPinjam(next);
                      if (next && next < todayYmd) {
                        setLoanModalError("Tanggal tidak boleh di masa lalu.");
                        setLoanSuccess(null);
                      } else if (loanModalError) setLoanModalError(null);
                    }}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-700">
                    Periode (hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={periodeHari}
                    onChange={(e) => setPeriodeHari(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-black"
                  />
                </div>
                <div className="text-sm text-slate-600">
                  Akhir Peminjaman: {akhirPinjam || "-"}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLoanModalOpen(false)}
                  disabled={submittingLoan}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-900 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAjukanPeminjaman}
                  disabled={submittingLoan || !numericBukuId}
                  className="h-10 rounded-xl bg-[#6b3a22] px-4 font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingLoan ? "Mengajukan…" : "Kirim Pengajuan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Tulis / Edit Ulasan (PBI-33, PBI-34) ───────────────────────── */}
        {reviewModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setReviewModalOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingReview ? "Edit Ulasan" : "Tulis Ulasan"}
              </h3>
              {reviewError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {reviewError}
                </div>
              )}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Rating
                  </label>
                  <StarPicker value={ratingInput} onChange={setRatingInput} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Komentar
                  </label>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    rows={4}
                    placeholder="Tulis pengalamanmu membaca buku ini…"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#6b3a22] focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReviewModalOpen(false);
                    setEditingReview(null);
                    setReviewError(null);
                  }}
                  disabled={reviewSubmitting}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-900 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="h-10 rounded-xl bg-[#6b3a22] px-4 font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewSubmitting ? "Menyimpan…" : "Kirim"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Konfirmasi hapus (PBI-35) ────────────────────────────────────────── */}
        {deleteConfirmId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="font-semibold text-slate-900">Hapus Ulasan?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Ulasan yang dihapus tidak dapat dikembalikan.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-4 font-medium text-slate-900 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteReview(deleteConfirmId)}
                  className="h-10 rounded-xl bg-red-500 px-4 font-medium text-white hover:opacity-90"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
        {showArchiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M12 3.75l9 15.75H3l9-15.75z"
                  />
                </svg>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Hapus Buku?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Apakah Anda yakin ingin menghapus buku ini? Tindakan ini akan
                memindahkan buku ke arsip.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleArchiveBook}
                  disabled={archiving}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {archiving ? "Menghapus..." : "Ya, Hapus"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  disabled={archiving}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {digitalPreviewOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDigitalPreview();
            }}
          >
            <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Preview Buku Digital (Read Only)
                </h3>
                <div className="flex items-center gap-2">
                  {digitalPreviewUrl ? (
                    <button
                      type="button"
                      onClick={() => openInNewTab(digitalPreviewUrl)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    >
                      Buka di tab baru
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeDigitalPreview}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    X
                  </button>
                </div>
              </div>

              {digitalPreviewError ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {digitalPreviewError}
                </div>
              ) : null}

              {digitalPreviewLoading ? (
                <div className="flex h-[70vh] items-center justify-center text-sm text-slate-500">
                  Memuat preview...
                </div>
              ) : digitalPreviewSrc ? (
                <iframe
                  src={digitalPreviewSrc}
                  title="Preview Buku Digital"
                  className="h-[70vh] w-full rounded-xl border border-slate-200"
                />
              ) : digitalPreviewUrl ? (
                <div className="flex h-[70vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-500">
                  <p>Preview tidak dapat ditampilkan di halaman ini.</p>
                  <button
                    type="button"
                    onClick={() => openInNewTab(digitalPreviewUrl)}
                    className="inline-flex items-center justify-center rounded-lg bg-[#6b3a22] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  >
                    Buka di tab baru
                  </button>
                </div>
              ) : (
                <div className="flex h-[70vh] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                  Preview belum tersedia.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── DetailItem ───────────────────────────────────────────────────────────────

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-700">{value}</dd>
    </div>
  );
}
