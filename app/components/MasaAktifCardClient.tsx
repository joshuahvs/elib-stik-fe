"use client";

import { useEffect, useState } from "react";
import { fetchMe } from "@/app/lib/me";

function calculateRemainingParts(targetDate: string) {
  const now = new Date();
  const target = new Date(targetDate);

  if (Number.isNaN(target.getTime()) || target.getTime() <= now.getTime()) {
    return {
      totalDays: 0,
      years: 0,
      months: 0,
      days: 0,
    };
  }

  const totalMs = target.getTime() - now.getTime();
  const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));

  let temp = new Date(now);
  let years = 0;
  let months = 0;

  while (true) {
    const next = new Date(temp);
    next.setFullYear(next.getFullYear() + 1);
    if (next <= target) {
      years++;
      temp = next;
    } else break;
  }

  while (true) {
    const next = new Date(temp);
    next.setMonth(next.getMonth() + 1);
    if (next <= target) {
      months++;
      temp = next;
    } else break;
  }

  const remainingMs = target.getTime() - temp.getTime();
  const days = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  return {
    totalDays,
    years,
    months,
    days,
  };
}

function formatStatusBadge(status?: string | null) {
  if (status === "Aktif") return "bg-green-100 text-green-700";
  if (status === "Nonaktif") return "bg-rose-100 text-rose-700";
  if (status === "Deleted") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

export default function MasaAktifCardClient() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe(token)
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!me) return null;
  if (me.role !== "mahasiswa") return null;

  const tanggalBatasAktif = me.tanggal_batas_aktif ?? null;
  const status = me.status ?? "-";
  const remaining = tanggalBatasAktif ? calculateRemainingParts(tanggalBatasAktif) : null;

  return (
    <div className="rounded-2xl bg-white shadow-lg border p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Status Masa Aktif Akun</h3>
          <p className="text-slate-600 mt-1">
            Informasi masa aktif akun mahasiswa.
          </p>
        </div>

        <span
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${formatStatusBadge(
            status
          )}`}
        >
          {status}
        </span>
      </div>

      {status === "Nonaktif" ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
          Masa aktif akun telah berakhir. Silakan hubungi admin untuk perpanjangan masa aktif.
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border bg-[#f8f6f4] p-6">
          <p className="text-sm text-slate-600 mb-2">Jenjang</p>
          <p className="text-2xl font-bold text-slate-900">{me.jenjang ?? "-"}</p>
        </div>

        <div className="rounded-2xl border bg-[#f8f6f4] p-6">
          <p className="text-sm text-slate-600 mb-2">Tanggal Batas Aktif</p>
          <p className="text-2xl font-bold text-slate-900">
            {tanggalBatasAktif
              ? new Intl.DateTimeFormat("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Jakarta",
                }).format(new Date(tanggalBatasAktif))
              : "-"}
          </p>
        </div>

        <div className="rounded-2xl border bg-[#f8f6f4] p-6">
          <p className="text-sm text-slate-600 mb-2">Sisa Masa Aktif</p>
          {remaining ? (
            <>
              <p className="text-4xl font-bold text-[#6b3a22] leading-none">
                {remaining.totalDays} Hari
              </p>
              <p className="mt-3 text-slate-700">
                ({remaining.years} Tahun {remaining.months} Bulan {remaining.days} Hari)
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-900">-</p>
          )}
        </div>
      </div>
    </div>
  );
}