"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import PrimaryButton from "@/app/components/PrimaryButton";
import { fetchAdminUsers } from "@/app/lib/adminUsers";
import {
  extendAdminUserMasaAktif,
  updateAdminUserStatus,
} from "@/app/lib/adminUserActions";
import ErrorMessage from "@/app/components/ErrorMessage";

function roleLabel(role: string | null) {
  if (!role) return "-";
  if (role === "mahasiswa") return "Mahasiswa";
  if (role === "dosen") return "Dosen";
  if (role === "umum") return "Umum";
  if (role === "admin") return "Admin";
  return role;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<"Aktif" | "Nonaktif" | "Deleted">(
    "Aktif",
  );
  const [years, setYears] = useState<number>(2);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token || !userId) return;

    setLoading(true);
    fetchAdminUsers({
      token,
      limit: 200,
    })
      .then((res) => {
        const found = res.data.find((x) => x.id === userId);
        setUser(found ?? null);
        setStatus((found?.status as any) ?? "Aktif");
      })
      .catch((e) => setError(e?.message ?? "Gagal mengambil detail pengguna"))
      .finally(() => setLoading(false));
  }, [token, userId]);

  async function handleUpdateStatus() {
    if (!token || !user) return;

    const ok = window.confirm(
      `Yakin ingin mengubah status akun menjadi ${status}?`,
    );
    if (!ok) return;

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      await updateAdminUserStatus({
        token,
        userId: user.id,
        status,
      });

      setMessage("Status akun berhasil diperbarui.");
      setUser((prev: any) => ({ ...prev, status }));
    } catch (e: any) {
      setError(e?.message ?? "Gagal memperbarui status akun");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExtend() {
    if (!token || !user) return;

    const ok = window.confirm(
      `Yakin ingin memperpanjang masa aktif selama ${years} tahun?`,
    );
    if (!ok) return;

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      const updated = await extendAdminUserMasaAktif({
        token,
        userId: user.id,
        years,
      });

      setUser(updated);
      setStatus(updated?.status ?? "Aktif");
      setMessage("Masa aktif berhasil diperpanjang.");
    } catch (e: any) {
      setError(e?.message ?? "Gagal memperpanjang masa aktif");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Edit Pengguna</h1>
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="text-sm text-slate-600 underline"
          >
            Kembali ke daftar pengguna
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-slate-600">
            Memuat detail pengguna...
          </div>
        ) : null}

        {!loading && !user ? (
          <div className="rounded-2xl border bg-white p-8 text-slate-600">
            Pengguna tidak ditemukan.
          </div>
        ) : null}

        {!loading && user ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Informasi Pengguna
              </h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-500">Nama Lengkap</p>
                  <p className="font-medium text-slate-900">
                    {user.nama_lengkap ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Username</p>
                  <p className="font-medium text-slate-900">
                    {user.username ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">E-mail</p>
                  <p className="font-medium text-slate-900">
                    {user.email ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Peran</p>
                  <p className="font-medium text-slate-900">
                    {roleLabel(user.role)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Jenjang</p>
                  <p className="font-medium text-slate-900">
                    {user.jenjang ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Tanggal Batas Aktif</p>
                  <p className="font-medium text-slate-900">
                    {user.tanggal_batas_aktif
                      ? new Intl.DateTimeFormat("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          timeZone: "Asia/Jakarta",
                        }).format(new Date(user.tanggal_batas_aktif))
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Aksi Admin
              </h2>

              {message ? (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                  {message}
                </div>
              ) : null}

              {error ? <ErrorMessage error={error} className="mb-4" /> : null}

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Ubah Status Akun
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif" disabled={user?.role === "umum"}>
                      Nonaktif{" "}
                      {user?.role === "umum" ? "(hanya mahasiswa)" : ""}
                    </option>
                    <option value="Deleted">Deleted</option>
                  </select>

                  <div className="mt-4">
                    <PrimaryButton
                      type="button"
                      onClick={handleUpdateStatus}
                      disabled={submitting}
                      className="h-11 px-8"
                    >
                      Simpan Status
                    </PrimaryButton>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Perpanjang Masa Aktif
                  </label>
                  <select
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                  >
                    <option value={1}>1 Tahun</option>
                    <option value={2}>2 Tahun</option>
                    <option value={3}>3 Tahun</option>
                    <option value={4}>4 Tahun</option>
                  </select>

                  <div className="mt-4">
                    <PrimaryButton
                      type="button"
                      onClick={handleExtend}
                      disabled={submitting}
                      className="h-11 px-8"
                    >
                      Perpanjang Masa Aktif
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
