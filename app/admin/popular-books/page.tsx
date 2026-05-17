"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
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

export default function PopularBooksPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState<PopularBook[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [toast, setToast] = useState<ToastState | null>(null);

  // Session check
  useEffect(() => {
    const storedToken = window.localStorage.getItem("token");
    if (!storedToken) {
      window.location.href = "/auth/login";
      return;
    }
    setToken(storedToken);
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
          token,
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
        token,
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
          <div className="flex flex-col gap-6 items-start sm:items-center sm:justify-between sm:flex-row">
            <div>
              <h1 className="text-4xl font-bold">Buku Terpopuler</h1>
              <p className="mt-2 text-[#e8d5c4]">Buku dengan jumlah peminjaman terbanyak</p>
            </div>
            
            {/* Filter Section in Header */}
            <div className="w-full sm:w-auto flex flex-col gap-2 sm:items-end">
              <label className="text-sm font-semibold text-[#e8d5c4]">Filter Kategori</label>
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-white text-black font-semibold flex-1 sm:flex-none bg-white"
                  style={{
                    backgroundColor: 'white',
                    color: 'black',
                  }}
                >
                  <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} style={{ backgroundColor: 'white', color: 'black' }}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-400 text-[#6b3a22] font-semibold rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">

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
        )}
      </main>
    </div>
  );
}

