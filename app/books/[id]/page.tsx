"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/app/lib/api";
import { fetchDigitalSignedUrl, openInNewTab } from "@/app/lib/booksDigital";

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
      const msg = e instanceof Error ? e.message : "Gagal membuka buku digital";
      alert(msg);
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm underline text-slate-700">
            Kembali
          </Link>

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
