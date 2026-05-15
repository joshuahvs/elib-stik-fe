"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";

function getRoleLabel(role?: string) {
  if (!role) return "";
  if (role === "mahasiswa") return "Mahasiswa";
  if (role === "dosen") return "Dosen";
  if (role === "umum") return "Umum";
  return role;
}

function formatDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default function KunjunganPage() {
  const router = useRouter();

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);

  const [nama, setNama] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const tanggalKunjunganDisplay = useMemo(() => formatDisplayDate(), []);

  useEffect(() => {
    const nextToken = window.localStorage.getItem("token");
    setToken(nextToken);

    if (!nextToken) {
      router.replace("/auth/login?redirect=/kunjungan");
      return;
    }

    async function init() {
      try {
        setError(null);

        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${nextToken}`,
          },
        });

        if (!meRes.ok) {
          window.localStorage.removeItem("token");
          router.replace("/auth/login?redirect=/kunjungan");
          return;
        }

        const meData = await meRes.json();
        setMe(meData);

        const statusRes = await fetch(`${API_URL}/api/kunjungan/me/status`, {
          headers: {
            Authorization: `Bearer ${nextToken}`,
          },
        });

        const statusData = await statusRes.json().catch(() => null);

        if (!statusRes.ok) {
          throw new Error(
            getErrorMessage(statusData, "Gagal memuat status check-in."),
          );
        }

        if (statusData?.hasCheckedIn) {
          setHasCheckedIn(true);
          setSuccessMessage("Anda sudah check-in hari ini.");
        }
      } catch (err) {
        setError(getErrorMessage(err, "Terjadi kesalahan."));
      } finally {
        setIsPageLoading(false);
      }
    }

    init();
  }, [router]);

  const roleLabel = getRoleLabel(me?.role);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) return;

    if (!nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(true);

      const res = await fetch(`${API_URL}/api/kunjungan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama: nama.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = getErrorMessage(data, "Gagal mencatat kunjungan.");
        throw new Error(message);
      }

      setHasCheckedIn(true);
      setSuccessMessage("Check-in berhasil.");
    } catch (err) {
      const message = getErrorMessage(err, "Gagal mencatat kunjungan.");

      if (message.toLowerCase().includes("sudah check-in")) {
        setHasCheckedIn(true);
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Memuat halaman check-in...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="relative min-h-screen">
        <div className="absolute inset-0 bg-[url('/bg-3.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative min-h-screen flex items-center justify-center px-6 py-10 pt-28">
          <div className="w-full max-w-md">
            <h1 className="text-center text-3xl md:text-4xl font-bold text-white mb-10">
              Lapor Masuk Perpustakaan
            </h1>

            <ErrorMessage error={error} className="mb-4" />

            {successMessage ? (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                {successMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-2 text-white/90">
                  Tanggal Kunjungan
                </label>
                <input
                  type="text"
                  value={tanggalKunjunganDisplay}
                  readOnly
                  className="w-full rounded-md border border-white bg-white px-4 py-3 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-white/90">Email</label>
                <input
                  type="text"
                  value={me?.email ?? ""}
                  readOnly
                  className="w-full rounded-md border border-white bg-white px-4 py-3 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-white/90">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Nama"
                  disabled={hasCheckedIn}
                  className="w-full rounded-md border border-white bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-white/90">Role</label>
                <input
                  type="text"
                  value={roleLabel}
                  readOnly
                  className="w-full rounded-md border border-white bg-white px-4 py-3 text-slate-900 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || hasCheckedIn}
                className="mt-6 w-full rounded-md bg-black py-3 text-white font-semibold transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {hasCheckedIn
                  ? "Sudah Check-in Hari Ini"
                  : isSubmitting
                    ? "Mencatat Kunjungan..."
                    : "Catat Kunjungan"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-white underline underline-offset-2 hover:text-white/80"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}