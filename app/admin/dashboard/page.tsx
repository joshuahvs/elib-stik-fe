"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchDailyCirculationDashboard,
  fetchDailyCirculationDetail,
  DailyCirculationStats,
  DailyCirculationDetail,
} from "@/app/lib/peminjamanBuku";
import { fetchAdminUsers } from "@/app/lib/adminUsers";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";

interface SessionData {
  accessToken: string;
  user: {
    role: string;
    email: string;
  };
}

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

function formatDatetime(isoDatetime: string) {
  if (!isoDatetime) return "-";
  const d = new Date(isoDatetime);
  if (Number.isNaN(d.getTime())) return isoDatetime;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusLabel(statusRaw: any): string {
  const s = String(statusRaw ?? "-").toUpperCase();
  if (s === "DIAJUKAN") return "Diajukan";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  if (s === "DIPINJAM" || s === "DIAMBIL") return "Diambil";
  if (s === "DIKEMBALIKAN" || s === "SELESAI") return "Dikembalikan";
  return String(statusRaw ?? "-");
}

function statusBadgeClass(statusRaw: any): string {
  const s = String(statusRaw ?? "").toUpperCase();
  if (s === "DIAJUKAN") return "bg-blue-600 text-white";
  if (s === "DISETUJUI") return "bg-green-600 text-white";
  if (s === "DIPINJAM" || s === "DIAMBIL") return "bg-purple-600 text-white";
  if (s === "DIKEMBALIKAN" || s === "SELESAI") return "bg-slate-200 text-slate-700";
  if (s === "DITOLAK") return "bg-red-600 text-white";
  return "bg-white border text-slate-700";
}

function StatCard({
  title,
  value,
  icon,
  color,
  loading = false,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className={`${color} rounded-lg shadow p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">
            {loading ? "..." : value}
          </p>
        </div>
        <div className="text-5xl opacity-30">{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [stats, setStats] = useState<DailyCirculationStats | null>(null);
  const [detail, setDetail] = useState<DailyCirculationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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

  // Fetch user list to map user_id to nama_lengkap
  useEffect(() => {
    if (!session?.accessToken) return;

    let cancelled = false;

    fetchAdminUsers({ token: session.accessToken, limit: 500 })
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const u of res.data ?? []) {
          const label =
            typeof u.nama_lengkap === "string" && u.nama_lengkap.trim()
              ? u.nama_lengkap.trim()
              : typeof u.username === "string" && u.username.trim()
                ? u.username.trim()
                : typeof u.email === "string" && u.email.trim()
                  ? u.email.trim()
                  : "";
          if (label) map[u.id] = label;
        }
        setUserNameById(map);
      })
      .catch(() => {
        // Ignore; fall back to data from the detail endpoint
      });

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, detailRes] = await Promise.all([
          fetchDailyCirculationDashboard({ token: session.accessToken }),
          fetchDailyCirculationDetail({
            token: session.accessToken,
            page,
            limit,
          }),
        ]);

        setStats(statsRes);
        setDetail(detailRes);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.accessToken, page, limit]);

  if (!session) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Sirkulasi Harian</h1>
          <p className="text-gray-600 mt-2">Ringkasan aktivitas peminjaman hari ini</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Peminjaman Hari Ini"
            value={stats?.statistics?.peminjaman_hari_ini ?? 0}
            icon="📚"
            color="bg-[#6b3a22]"
            loading={loading}
          />
          <StatCard
            title="Pengembalian Hari Ini"
            value={stats?.statistics?.pengembalian_hari_ini ?? 0}
            icon="✓"
            color="bg-green-600"
            loading={loading}
          />
          <StatCard
            title="Keterlambatan Hari Ini"
            value={stats?.statistics?.keterlambatan_hari_ini ?? 0}
            icon="⏰"
            color="bg-red-500"
            loading={loading}
          />
        </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Detail Sirkulasi</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading data...</div>
        ) : detail && detail.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#6b3a22] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      ID Peminjaman
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Nama Peminjam
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Judul Buku
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Tanggal Pinjam
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Tanggal Kembali
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.data.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {item.displayId || `#${item.id}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {userNameById[item.user_id] || item.users?.email || item.users?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.buku?.judul || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDatetime(item.tanggal_peminjaman || "-")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.tanggal_pengembalian ? formatDatetime(item.tanggal_pengembalian) : item.akhir_peminjaman ? formatDatetime(item.akhir_peminjaman) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadgeClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {detail.data.length} dari {detail.meta.total} data
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sebelumnya
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Halaman {detail.meta.page} dari {detail.meta.totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setPage(Math.min(detail.meta.totalPages, page + 1))}
                  disabled={page >= detail.meta.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Tidak ada data peminjaman hari ini
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#6b3a22] text-white rounded-lg font-medium hover:bg-[#523d2c] transition"
        >
          Refresh
        </button>
      </div>
    </div>
    </div>
  );
}
