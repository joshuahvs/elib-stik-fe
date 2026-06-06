"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type SummaryData = {
  totalActiveStudents: number;
  totalTransactions: number;
  averageBorrowings: number;
  mostActiveStudent: string;
};

type RankingItem = {
  nama: string;
  jumlah: number;
};

type ChartItem = {
  jenjang: string;
  total: number;
};

async function fetchDashboardData(month?: string, year?: string) {
  const query = new URLSearchParams();

  if (month) query.append("month", month);
  if (year) query.append("year", year);

  const [summaryRes, rankingRes, chartRes] = await Promise.all([
    fetch(`${API_URL}/dashboard-keaktifan/summary?${query.toString()}`, {
      cache: "no-store",
    }),
    fetch(`${API_URL}/dashboard-keaktifan/ranking?${query.toString()}`, {
      cache: "no-store",
    }),
    fetch(`${API_URL}/dashboard-keaktifan/chart?${query.toString()}`, {
      cache: "no-store",
    }),
  ]);

  if (!summaryRes.ok || !rankingRes.ok || !chartRes.ok) {
    throw new Error("Gagal memuat dashboard keaktifan");
  }

  const [summary, ranking, chart] = await Promise.all([
    summaryRes.json(),
    rankingRes.json(),
    chartRes.json(),
  ]);

  return {
    summary: summary as SummaryData,
    ranking: Array.isArray(ranking) ? (ranking as RankingItem[]) : [],
    chart: Array.isArray(chart) ? (chart as ChartItem[]) : [],
  };
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="mb-2 text-sm text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold text-[#8B4513]">{value}</h2>
    </div>
  );
}

export default function DashboardKeaktifanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const month = searchParams.get("month") ?? "";
  const year = searchParams.get("year") ?? "";

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData>({
    totalActiveStudents: 0,
    totalTransactions: 0,
    averageBorrowings: 0,
    mostActiveStudent: "-",
  });
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [chart, setChart] = useState<ChartItem[]>([]);

  useEffect(() => {
    const token = window.localStorage.getItem("token");

    if (!token) {
      router.replace("/auth/login?redirect=/dashboard-keaktifan");
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) return;

    let cancelled = false;

    async function loadDashboard() {
      try {
        setIsLoadingData(true);
        setLoadError(null);

        const data = await fetchDashboardData(month, year);

        if (cancelled) return;

        setSummary(data.summary);
        setRanking(data.ranking);
        setChart(data.chart);
      } catch (error) {
        if (cancelled) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Gagal memuat dashboard keaktifan",
        );
        setSummary({
          totalActiveStudents: 0,
          totalTransactions: 0,
          averageBorrowings: 0,
          mostActiveStudent: "-",
        });
        setRanking([]);
        setChart([]);
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [isCheckingAuth, month, year]);

  const handleFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextMonth = String(formData.get("month") ?? "");
    const nextYear = String(formData.get("year") ?? "");
    const query = new URLSearchParams();

    if (nextMonth) query.set("month", nextMonth);
    if (nextYear) query.set("year", nextYear);

    router.push(
      query.toString()
        ? `/dashboard-keaktifan?${query.toString()}`
        : "/dashboard-keaktifan",
    );
  };

  const hasFilters = useMemo(() => Boolean(month || year), [month, year]);

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-[#f8f8f8]">
        <section className="bg-gradient-to-r from-[#4b1e00] to-[#8B4513] text-white">
          <div className="mx-auto max-w-7xl px-8 py-10">
            <h1 className="text-4xl font-bold">
              Dashboard Keaktifan Anggota Perpustakaan
            </h1>
            <p className="mt-3 text-lg text-gray-200">
              Memeriksa sesi pengguna...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900">
      <section className="bg-gradient-to-r from-[#4b1e00] to-[#8B4513] text-white">
        <div className="mx-auto max-w-7xl px-8 py-10">
          <h1 className="text-4xl font-bold">
            Dashboard Keaktifan Anggota Perpustakaan
          </h1>

          <p className="mt-3 text-lg text-gray-200">
            Ringkasan statistik keaktifan dan peminjaman koleksi perpustakaan
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-wrap items-center gap-3"
          >
            <select
              name="month"
              defaultValue={month}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513]"
            >
              <option value="" className="text-slate-900">Pilih Bulan</option>
              <option value="1" className="text-slate-900">Januari</option>
              <option value="2" className="text-slate-900">Februari</option>
              <option value="3" className="text-slate-900">Maret</option>
              <option value="4" className="text-slate-900">April</option>
              <option value="5" className="text-slate-900">Mei</option>
              <option value="6" className="text-slate-900">Juni</option>
              <option value="7" className="text-slate-900">Juli</option>
              <option value="8" className="text-slate-900">Agustus</option>
              <option value="9" className="text-slate-900">September</option>
              <option value="10" className="text-slate-900">Oktober</option>
              <option value="11" className="text-slate-900">November</option>
              <option value="12" className="text-slate-900">Desember</option>
            </select>

            <select
              name="year"
              defaultValue={year}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 outline-none focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513]"
            >
              <option value="" className="text-slate-900">Pilih Tahun</option>
              <option value="2022" className="text-slate-900">2022</option>
              <option value="2023" className="text-slate-900">2023</option>
              <option value="2024" className="text-slate-900">2024</option>
              <option value="2025" className="text-slate-900">2025</option>
              <option value="2026" className="text-slate-900">2026</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-[#8B4513] px-5 py-2 text-white hover:bg-[#6f3410]"
            >
              Filter
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={() => router.push("/dashboard-keaktifan")}
                className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Mahasiswa Aktif"
            value={summary.totalActiveStudents}
          />
          <SummaryCard
            title="Total Transaksi Peminjaman"
            value={summary.totalTransactions}
          />
          <SummaryCard
            title="Rata-rata Peminjaman"
            value={summary.averageBorrowings}
          />
          <SummaryCard
            title="Mahasiswa Paling Aktif"
            value={summary.mostActiveStudent}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold text-slate-900">
              Ranking Mahasiswa Paling Aktif
            </h2>

            {isLoadingData ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <table className="w-full text-sm text-slate-800">
                <thead>
                  <tr className="border-b border-gray-200 text-slate-500 font-semibold">
                    <th className="py-3 text-left font-semibold">Rank</th>
                    <th className="py-3 text-left font-semibold">Nama Mahasiswa</th>
                    <th className="py-3 text-left font-semibold">Jumlah Peminjaman</th>
                  </tr>
                </thead>

                <tbody>
                  {ranking.length > 0 ? (
                    ranking.map((item, index) => (
                      <tr key={`${item.nama}-${index}`} className="border-b border-gray-200">
                        <td className="py-3 font-semibold text-[#8B4513]">
                          #{index + 1}
                        </td>
                        <td className="py-3 text-slate-800">{item.nama}</td>
                        <td className="py-3 font-semibold text-slate-900">{item.jumlah}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 text-center text-gray-500"
                      >
                        Tidak ada data ranking
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold text-slate-900">
              Statistik Berdasarkan Jenjang
            </h2>

            {isLoadingData ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-6">
                {chart.length > 0 ? (
                  chart.map((item, index) => (
                    <div key={`${item.jenjang}-${index}`}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.jenjang}</span>
                        <span className="font-semibold text-slate-900">{item.total}</span>
                      </div>

                      <div className="h-4 w-full rounded-full bg-gray-200">
                        <div
                          className="h-4 rounded-full bg-[#A0522D]"
                          style={{ width: `${Math.min(item.total * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Tidak ada data chart</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Data keaktifan dihitung berdasarkan transaksi peminjaman buku yang
            telah dilakukan pengguna.
          </p>
        </div>
      </div>
    </main>
  );
}
