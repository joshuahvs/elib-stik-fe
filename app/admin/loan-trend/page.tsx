"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { fetchLoanTrend, LoanTrendData } from "@/app/lib/peminjamanBuku";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";

interface SessionData {
  accessToken: string;
  user: {
    role: string;
    email: string;
  };
}

type ChartType = "line" | "bar";
type GroupBy = "daily" | "weekly" | "monthly";

function formatDate(isoDate: string) {
  if (!isoDate) return "-";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function getGroupedData(
  data: Array<{ date: string; count: number }>,
  groupBy: GroupBy
) {
  if (groupBy === "daily") {
    return data;
  }

  const grouped: Record<string, number> = {};
  const labels: Record<string, string> = {};

  for (const item of data) {
    const date = new Date(`${item.date}T00:00:00`);
    let key: string;
    let label: string;

    if (groupBy === "weekly") {
      const year = date.getFullYear();
      const weekNum = Math.ceil(
        ((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
      );
      key = `${year}-W${String(weekNum).padStart(2, "0")}`;
      label = `Week ${weekNum}, ${year}`;
    } else {
      // monthly
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      key = `${year}-${month}`;
      const monthName = new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(date);
      label = monthName;
    }

    if (!grouped[key]) {
      grouped[key] = 0;
      labels[key] = label;
    }
    grouped[key] += item.count;
  }

  return Object.entries(grouped).map(([key, count]) => ({
    date: key,
    count,
    label: labels[key],
  }));
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{ value: number; payload: any }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-gray-900">
          {data.label || formatDate(data.date)}
        </p>
        <p className="text-[#6b3a22] font-bold">
          Transaksi: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export default function LoanTrendPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [trendData, setTrendData] = useState<LoanTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [groupBy, setGroupBy] = useState<GroupBy>("daily");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Initialize dates to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const formatIsoDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatIsoDate(thirtyDaysAgo));
    setEndDate(formatIsoDate(today));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) router.push("/auth/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          if (!cancelled) router.push("/auth/login");
          return;
        }

        const userData = await res.json();

        if (userData?.role !== "admin") {
          if (!cancelled) router.push("/");
          return;
        }

        if (!cancelled) {
          setSession({
            accessToken: token,
            user: {
              role: userData.role,
              email: userData.email,
            },
          });
        }
      } catch {
        if (!cancelled) router.push("/auth/login");
      }
    }

    verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!session?.accessToken || !startDate || !endDate) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchLoanTrend({
          token: session.accessToken,
          startDate,
          endDate,
        });

        setTrendData(data);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.accessToken, startDate, endDate]);

  const groupedData = useMemo(() => {
    if (!trendData) return [];
    return getGroupedData(trendData.data, groupBy);
  }, [trendData, groupBy]);

  if (!session) {
    return <div className="p-4">Loading...</div>;
  }

  const chartData = groupedData.length > 0 ? groupedData : trendData?.data || [];
  const maxCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.count)) : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">
            Visualisasi Tren Peminjaman
          </h1>
          <p className="text-gray-600 mt-2">
            Grafik frekuensi transaksi peminjaman buku berdasarkan rentang tanggal
          </p>
        </div>

        {error && <ErrorMessage error={error} />}

        {/* Filters */}
        <div className="mb-8 bg-[#6b3a22] p-6 rounded-lg border-2 border-[#6b3a22]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b3a22] focus:border-transparent text-black font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b3a22] focus:border-transparent text-black font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Pengelompokan
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b3a22] focus:border-transparent text-black font-semibold bg-white"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Tipe Grafik
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b3a22] focus:border-transparent text-black font-semibold bg-white"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
          </div>

          {trendData && (
            <div className="text-sm text-white font-medium">
              <span>
                Total Transaksi: {trendData.meta.total}
              </span>
              {" • "}
              <span>
                Rata-rata per hari: {trendData.meta.averagePerDay}
              </span>
              {" • "}
              <span>
                Periode: {formatDate(trendData.meta.startDate)} s/d{" "}
                {formatDate(trendData.meta.endDate)}
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-[#6b3a22]">
          <h2 className="text-xl font-bold text-[#6b3a22] mb-4">Grafik Jumlah Peminjaman</h2>
          {loading ? (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg font-semibold">Memuat grafik...</p>
                <p className="text-sm mt-2">Mengambil data dari server</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg font-semibold">Tidak ada data</p>
                <p className="text-sm mt-2">Tidak ada transaksi peminjaman untuk periode ini</p>
              </div>
            </div>
          ) : (
            <div style={{ width: "100%", height: 400 }} key={`${chartType}-${groupBy}`}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    key={`line-${groupBy}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      label={{
                        value: "Jumlah Transaksi",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      formatter={() => "Jumlah Peminjaman"}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Jumlah Peminjaman"
                      isAnimationActive={true}
                    />
                  </LineChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    key={`bar-${groupBy}`}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      label={{
                        value: "Jumlah Transaksi",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      formatter={() => "Jumlah Peminjaman"}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      name="Jumlah Peminjaman"
                      isAnimationActive={true}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {trendData && chartData.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#6b3a22] text-white rounded-lg p-6 shadow-lg border-2 border-[#6b3a22]">
              <p className="text-sm opacity-90 font-semibold">Total Transaksi</p>
              <p className="text-4xl font-bold mt-3">{trendData.meta.total}</p>
            </div>
            <div className="bg-blue-700 text-white rounded-lg p-6 shadow-lg border-2 border-blue-700">
              <p className="text-sm opacity-90 font-semibold">Rata-rata per Hari</p>
              <p className="text-4xl font-bold mt-3">
                {parseFloat(trendData.meta.averagePerDay).toFixed(1)}
              </p>
            </div>
            <div className="bg-green-700 text-white rounded-lg p-6 shadow-lg border-2 border-green-700">
              <p className="text-sm opacity-90 font-semibold">Hari Terpadat</p>
              <p className="text-4xl font-bold mt-3">
                {Math.max(...chartData.map(d => d.count))}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
