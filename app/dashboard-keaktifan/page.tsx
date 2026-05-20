"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";


async function getSummary(month?: string, year?: string) {
  const query = new URLSearchParams();

  if (month) query.append("month", month);
  if (year) query.append("year", year);

  const res = await fetch(
    `${API_URL}/dashboard-keaktifan/summary?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  return res.json();
}

async function getRanking(month?: string, year?: string) {
  const query = new URLSearchParams();

  if (month) query.append("month", month);
  if (year) query.append("year", year);

  const res = await fetch(
    `${API_URL}/dashboard-keaktifan/ranking?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  return res.json();
}

async function getChart(month?: string, year?: string) {
  const query = new URLSearchParams();

  if (month) query.append("month", month);
  if (year) query.append("year", year);

  const res = await fetch(
    `${API_URL}/dashboard-keaktifan/chart?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  return res.json();
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <h2 className="text-3xl font-bold text-[#8B4513]">{value}</h2>
    </div>
  );
}

export default async function DashboardKeaktifanPage({
  searchParams,
}: {
  searchParams: {
    month?: string;
    year?: string;
  };
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/auth/login");
    }
  }, []);
  const params = await searchParams
  const month = params.month
  const year = params.year

  const summary = await getSummary(month, year);
  const ranking = await getRanking(month, year);
  const chart = await getChart(month, year);

  const maxChartValue =
    chart.length > 0
      ? Math.max(...chart.map((item: any) => item.total))
      : 0;

  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      {/* HERO */}
      <section className="bg-gradient-to-r from-[#4b1e00] to-[#8B4513] text-white">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <h1 className="text-4xl font-bold">
            Dashboard Keaktifan Anggota Perpustakaan
          </h1>

          <p className="text-gray-200 mt-3 text-lg">
            Ringkasan statistik keaktifan dan peminjaman koleksi perpustakaan
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* FILTER */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
          <form
            action="/dashboard-keaktifan"
            className="flex flex-wrap gap-3 items-center"
          >
            <select
              name="month"
              defaultValue={month || ""}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Pilih Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select
              name="year"
              defaultValue={year || ""}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Pilih Tahun</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>

            <button
              type="submit"
              className="bg-[#8B4513] hover:bg-[#6f3410] text-white px-5 py-2 rounded-lg"
            >
              Filter
            </button>
          </form>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-500">
              Total Mahasiswa Aktif
            </p>

            <h2 className="text-3xl font-bold text-[#8B4513] mt-2">
              {summary?.totalActiveStudents || 0}
            </h2>
          </div>

          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-500">
              Total Transaksi Peminjaman
            </p>

            <h2 className="text-3xl font-bold text-[#8B4513] mt-2">
              {summary?.totalTransactions || 0}
            </h2>
          </div>

          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-500">
              Rata-rata Peminjaman
            </p>

            <h2 className="text-3xl font-bold text-[#8B4513] mt-2">
              {summary?.averageBorrowings || 0}
            </h2>
          </div>

          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <p className="text-sm text-gray-500">
              Mahasiswa Paling Aktif
            </p>

            <h2 className="text-2xl font-bold text-[#8B4513] mt-2">
              {summary?.mostActiveStudent || "-"}
            </h2>
          </div>
        </div>


<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

  {/* RANKING */}
  <div className="border rounded-2xl p-6 bg-white shadow-sm">
    <h2 className="text-2xl font-bold mb-5">
      Ranking Mahasiswa Paling Aktif
    </h2>

    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-3">Rank</th>
          <th className="text-left py-3">
            Nama Mahasiswa
          </th>
          <th className="text-left py-3">
            Jumlah Peminjaman
          </th>
        </tr>
      </thead>

      <tbody>
        {ranking.length > 0 ? (
          ranking.map(
            (
              item: any,
              index: number
            ) => (
              <tr
                key={index}
                className="border-b"
              >
                <td className="py-3 font-semibold text-[#8B4513]">
                  #{index + 1}
                </td>

                <td>{item.nama}</td>

                <td className="font-semibold">
                  {item.jumlah}
                </td>
              </tr>
            )
          )
        ) : (
          <tr>
            <td
              colSpan={3}
              className="text-center py-4 text-gray-500"
            >
              Tidak ada data ranking
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* CHART */}
  <div className="border rounded-2xl p-6 bg-white shadow-sm">
    <h2 className="text-2xl font-bold mb-5">
      Statistik Berdasarkan Jenjang
    </h2>

    <div className="space-y-6">
      {chart.length > 0 ? (
        chart.map(
          (
            item: any,
            index: number
          ) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">
                  {item.jenjang}
                </span>

                <span className="font-semibold">
                  {item.total}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-[#A0522D] h-4 rounded-full"
                  style={{
                    width: `${Math.min(
                      item.total * 5,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )
        )
      ) : (
        <p className="text-gray-500">
          Tidak ada data chart
        </p>
      )}
    </div>
  </div>
</div>

        {/* FOOTNOTE */}
        <div className="bg-white rounded-xl shadow-sm p-5 mt-6 border">
          <p className="text-sm text-gray-500">
            Data keaktifan dihitung berdasarkan transaksi peminjaman buku
            yang telah dilakukan pengguna.
          </p>
        </div>
      </div>
    </main>
  );
}