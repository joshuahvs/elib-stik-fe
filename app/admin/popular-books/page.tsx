"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import {
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
import { fetchPopularBooks, PopularBook, PopularBooksData } from "@/app/lib/peminjamanBuku";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";

type ToastState = {
  tone: "success" | "error";
  message: string;
};

// Clean author name from JSON format
function cleanAuthorName(raw: string): string {
  if (!raw) return "Penulis tidak diketahui";
  
  // Remove quotes, brackets, and extra whitespace
  let cleaned = raw.replace(/[\[\]"]/g, "").trim();
  
  // If it looks like array notation, split and take first
  if (cleaned.includes(",")) {
    cleaned = cleaned.split(",")[0].trim();
  }
  
  return cleaned || "Penulis tidak diketahui";
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{ value: number; payload: any }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="text-gray-900 font-semibold">{payload[0].payload.judul}</p>
        <p className="text-[#6b3a22] font-bold text-sm mt-1">
          Peminjaman: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export default function PopularBooksPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState<PopularBook[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Session check
  useEffect(() => {
    const storedToken = window.localStorage.getItem("token");
    if (!storedToken) {
      window.location.href = "/auth/login";
      return;
    }
    setToken(storedToken);
  }, []);

  // Set mounted flag for hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch popular books
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchPopularBooks({
          token: token as string,
          category: selectedCategory || undefined,
          limit: 5,
        });

        if (!cancelled) {
          setBooks(res.data ?? []);
          setCategories(res.categories ?? []);
        }
      } catch (e) {
        const msg = getErrorMessage(e, "Gagal mengambil data buku populer");
        if (!cancelled) {
          setError(msg);
          setBooks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [token, selectedCategory]);

  // Refresh data
  async function handleRefresh() {
    if (!token) return;

    try {
      setRefreshing(true);
      setError(null);

      const res = await fetchPopularBooks({
        token: token as string,
        category: selectedCategory || undefined,
        limit: 5,
      });

      setBooks(res.data ?? []);
      setCategories(res.categories ?? []);
      setToast({
        tone: "success",
        message: "Data berhasil diperbarui",
      });
    } catch (e) {
      const msg = getErrorMessage(e, "Gagal memperbarui data");
      setError(msg);
      setToast({
        tone: "error",
        message: msg,
      });
    } finally {
      setRefreshing(false);
    }
  }

  // Calculate max loans for progress bar scaling
  const maxLoans = books.length > 0 ? Math.max(...books.map((b) => b.jumlah_peminjaman)) : 1;

  return (
    <div className="min-h-screen bg-white">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white ${
          toast.tone === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#6b3a22] text-white py-8 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold">Buku Terpopuler</h1>
            <p className="text-[#e8d5c4]">Buku dengan jumlah peminjaman terbanyak</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Filter Section */}
        <div className="mb-6 rounded-xl border-2 border-[#6b3a22] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Filter
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory("")}
                className="text-xs font-medium text-slate-500 hover:text-[#6b3a22] transition"
              >
                Hapus Filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Jenis Koleksi */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Jenis Koleksi</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#6b3a22] focus:ring-2 focus:ring-[#6b3a22]/20 cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-gray-300 text-[#6b3a22] font-semibold rounded-lg flex items-center gap-2 transition-colors text-sm"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex gap-3">
            <AlertCircle className="flex-shrink-0 text-red-600" size={20} />
            <div>
              <p className="font-semibold text-red-800">Gagal Memuat Data</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b3a22]"></div>
            </div>
            <p className="mt-4 text-gray-600 font-semibold">Memuat data buku populer...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400" size={40} />
            <p className="mt-4 text-gray-600 font-semibold">Tidak ada data buku populer</p>
            <p className="text-gray-500 text-sm">Coba ubah kategori atau cek kembali nanti</p>
          </div>
        ) : (
          <>
            {/* Horizontal Bar Chart */}
            {isMounted && books.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 border-2 border-[#6b3a22] mb-8">
                <h2 className="text-xl font-bold text-[#6b3a22] mb-4">Visualisasi Buku Terpopuler</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={books}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <YAxis
                      type="category"
                      dataKey="judul"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      width={240}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(107, 58, 34, 0.1)" }} />
                    <Legend />
                    <Bar
                      dataKey="jumlah_peminjaman"
                      fill="#3b82f6"
                      name="Jumlah Peminjaman"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#6b3a22] text-white">
                  <th className="px-6 py-4 text-left font-semibold">NO.</th>
                  <th className="px-6 py-4 text-left font-semibold">JUDUL BUKU & PENGARANG</th>
                  <th className="px-6 py-4 text-left font-semibold">JUMLAH PEMINJAMAN</th>
                  <th className="px-6 py-4 text-center font-semibold">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {books.map((book, idx) => {
                  const percentage = (book.jumlah_peminjaman / maxLoans) * 100;
                  return (
                    <tr key={book.buku_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6b3a22] text-white font-semibold">
                          {book.no}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {book.judul}
                        </div>
                        <div className="text-gray-600 text-sm">{cleanAuthorName(book.nama_orang)}</div>
                        {book.subjek && (
                          <div className="text-gray-500 text-xs mt-1 italic">{book.subjek}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-900 min-w-12 text-right">
                              {book.jumlah_peminjaman}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/koleksi/${book.buku_id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#6b3a22] hover:bg-[#8b4a32] text-white font-semibold rounded-lg transition-colors"
                        >
                          <ExternalLink size={16} />
                          <span className="hidden sm:inline">Lihat Detail</span>
                          <span className="sm:hidden">Detail</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </main>
    </div>
  );
}


