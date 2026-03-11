"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function parseHashParams(hash: string): Record<string, string> {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(clean);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <main className="mx-auto max-w-xl px-6 py-10">
            <div className="rounded-2xl bg-white p-8 shadow-xl md:p-10">
              <h1 className="mb-3 text-center text-2xl font-bold text-slate-900 md:text-3xl">
                Verifikasi Email
              </h1>
              <div className="text-center">
                <p className="text-slate-700 font-medium">
                  Memproses verifikasi…
                </p>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hashParams, setHashParams] = useState<Record<string, string>>({});

  useEffect(() => {
    setHashParams(parseHashParams(window.location.hash));
  }, []);

  const data = useMemo(() => {
    const query: Record<string, string> = {};
    for (const [k, v] of searchParams.entries()) query[k] = v;
    return { ...query, ...hashParams };
  }, [searchParams, hashParams]);

  const error = data.error || data.error_code;
  const errorDescription = data.error_description
    ? decodeURIComponent(data.error_description.replace(/\+/g, " "))
    : undefined;

  const looksSuccessful = Boolean(
    (!error && (data.type === "signup" || data.access_token)) ||
    (!error && data.code),
  );

  useEffect(() => {
    if (!looksSuccessful) return;
    const t = window.setTimeout(() => {
      router.replace("/auth/login");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [looksSuccessful, router]);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-xl md:p-10">
          <h1 className="mb-3 text-center text-2xl font-bold text-slate-900 md:text-3xl">
            Verifikasi Email
          </h1>

          {error ? (
            <div className="text-center">
              <p className="font-medium text-red-700">
                Gagal memverifikasi email
              </p>
              <p className="mt-2 break-words text-slate-600">
                {errorDescription ||
                  "Link verifikasi tidak valid atau sudah kedaluwarsa."}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/auth/register"
                  className="text-slate-900 underline"
                >
                  Daftar ulang
                </Link>
                <span className="text-slate-300">|</span>
                <Link href="/auth/login" className="text-slate-900 underline">
                  Kembali ke login
                </Link>
              </div>
            </div>
          ) : looksSuccessful ? (
            <div className="text-center">
              <p className="font-medium text-green-700">
                Email berhasil terverifikasi
              </p>
              <p className="mt-2 text-slate-600">
                Mengarahkan ke halaman login…
              </p>
              <div className="mt-6">
                <Link href="/auth/login" className="text-slate-900 underline">
                  Ke halaman login
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium text-slate-700">
                Memproses verifikasi…
              </p>
              <p className="mt-2 text-slate-600">
                Jika tidak otomatis, klik{" "}
                <Link href="/auth/login" className="text-slate-900 underline">
                  di sini
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
