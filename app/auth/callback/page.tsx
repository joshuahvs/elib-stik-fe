"use client";

import { useEffect, useMemo, useState } from "react";
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
      <header className="w-full bg-white border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-900">eLib</div>
          <Link
            href="/auth/login"
            className="bg-black text-white px-5 py-2 rounded-full text-sm"
          >
            Masuk
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-3 text-slate-900">
            Verifikasi Email
          </h1>

          {error ? (
            <div className="text-center">
              <p className="text-red-700 font-medium">
                Gagal memverifikasi email
              </p>
              <p className="text-slate-600 mt-2 break-words">
                {errorDescription ||
                  "Link verifikasi tidak valid atau sudah kedaluwarsa."}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/auth/register"
                  className="underline text-slate-900"
                >
                  Daftar ulang
                </Link>
                <span className="text-slate-300">|</span>
                <Link href="/auth/login" className="underline text-slate-900">
                  Kembali ke login
                </Link>
              </div>
            </div>
          ) : looksSuccessful ? (
            <div className="text-center">
              <p className="text-green-700 font-medium">
                Email berhasil terverifikasi
              </p>
              <p className="text-slate-600 mt-2">
                Mengarahkan ke halaman login…
              </p>
              <div className="mt-6">
                <Link href="/auth/login" className="underline text-slate-900">
                  Ke halaman login
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-slate-700 font-medium">
                Memproses verifikasi…
              </p>
              <p className="text-slate-600 mt-2">
                Jika tidak otomatis, klik{" "}
                <Link href="/auth/login" className="underline text-slate-900">
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
