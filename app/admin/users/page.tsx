"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import PrimaryButton from "@/app/components/PrimaryButton";
import Link from "next/link";
import {
  fetchAdminUsers,
  type AdminUserRow,
  type UserStatus,
  type UserRole,
} from "@/app/lib/adminUsers";

function formatWIB(iso: string) {
  const d = new Date(iso);

  const day = String(
    Number(
      new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit" }).format(d)
    )
  ).padStart(2, "0");

  const month = String(
    Number(
      new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "2-digit" }).format(d)
    )
  ).padStart(2, "0");

  const year = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(d);

  const hour = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    hour12: false,
  }).format(d);

  const minute = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    minute: "2-digit",
  }).format(d);

  return `${day}-${month}-${year} ${hour}:${minute}`;
}

function formatDateOnly(iso?: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function roleLabel(role: string | null) {
  if (!role) return "-";
  if (role === "mahasiswa") return "Mahasiswa";
  if (role === "dosen") return "Dosen";
  if (role === "umum") return "Umum";
  if (role === "admin") return "Admin";
  return role;
}

function statusBadge(status: string | null) {
  const s = status ?? "-";
  if (s === "Aktif") return "bg-green-100 text-green-700";
  if (s === "Nonaktif") return "bg-rose-100 text-rose-700";
  if (s === "Deleted") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminUsersPage() {
  const [token, setToken] = useState<string | null>(null);

  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<UserStatus | "">("");
  const [role, setRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState<string>("");

  const limit = 200;

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);

    if (!t) {
      setMeLoading(false);
      return;
    }

    fetch("http://localhost:8080/auth/me", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((me) => {
        const r = me?.role ?? me?.user?.role ?? me?.data?.role;
        setIsAdmin(r === "admin");
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setMeLoading(false));
  }, []);

  async function load() {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchAdminUsers({
        token,
        status,
        role,
        email,
        limit,
      });

      setRows(res.data);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;
    load();
  }, [meLoading, token, isAdmin]);

  const empty = !isLoading && rows.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-6 py-10">
        {!meLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Daftar Pengguna</h1>
            <p className="mt-2 text-slate-600">Kamu belum login.</p>
            <div className="mt-6">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {!meLoading && token && !isAdmin ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Daftar Pengguna</h1>
            <p className="mt-2 text-slate-600">Halaman ini hanya bisa diakses oleh admin.</p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Daftar Pengguna</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-800 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                >
                  <option value="">Pilihan Opsi</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                  <option value="Deleted">Deleted</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-800 mb-2">Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                >
                  <option value="">Pilihan Opsi</option>
                  <option value="admin">Admin</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                  <option value="umum">Umum</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-800 mb-2">E-mail</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Cari email..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B5A3C]"
                />
              </div>

              <div className="md:col-span-1 md:justify-self-end">
                <PrimaryButton type="button" onClick={load} className="h-11 px-8">
                  Filter
                </PrimaryButton>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-10">
              <div className="rounded-2xl border overflow-hidden text-slate-900">
                <div
                  className="grid bg-[#6b3a22] text-white font-semibold text-sm"
                  style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 0.8fr 0.9fr 1fr 1.2fr 0.8fr" }}
                >
                  <div className="px-4 py-3">Nama</div>
                  <div className="px-4 py-3">E-mail</div>
                  <div className="px-4 py-3">Peran</div>
                  <div className="px-4 py-3">Jenjang</div>
                  <div className="px-4 py-3">Status</div>
                  <div className="px-4 py-3">Batas Aktif</div>
                  <div className="px-4 py-3">Terakhir Login</div>
                  <div className="px-4 py-3">Aksi</div>
                </div>

                {isLoading ? <div className="p-8 text-center text-slate-600">Memuat data…</div> : null}

                {empty ? (
                  <div className="p-8 text-center text-slate-600">
                    Tidak ada data pengguna pada filter ini.
                  </div>
                ) : null}

                {!isLoading && rows.length > 0 ? (
                  <div className="max-h-[560px] overflow-y-auto divide-y text-slate-900">
                    {rows.map((u) => (
                      <div
                        key={u.id}
                        className="grid text-sm items-start"
                        style={{ gridTemplateColumns: "1.4fr 1.6fr 1fr 0.8fr 0.9fr 1fr 1.2fr 0.8fr" }}
                      >
                        <div className="px-4 py-4 min-w-0">
                          <div className="font-medium break-words">{u.nama_lengkap ?? "-"}</div>
                          <div className="text-xs text-slate-500 break-words">{u.username ?? "-"}</div>
                        </div>

                        <div className="px-4 py-4 min-w-0 break-words">{u.email ?? "-"}</div>

                        <div className="px-4 py-4 whitespace-nowrap">{roleLabel(u.role)}</div>

                        <div className="px-4 py-4 whitespace-nowrap">{u.jenjang ?? "-"}</div>

                        <div className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                              u.status ?? null
                            )}`}
                          >
                            {u.status ?? "-"}
                          </span>
                        </div>

                        <div className="px-4 py-4 whitespace-nowrap">
                          {formatDateOnly(u.tanggal_batas_aktif ?? null)}
                        </div>

                        <div className="px-4 py-4 whitespace-nowrap">
                          {u.last_login_at ? formatWIB(u.last_login_at) : "-"}
                        </div>

                        <div className="px-4 py-4 flex items-start">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="inline-flex items-center rounded-lg bg-[#6b3a22] px-4 py-2 text-white text-sm font-medium hover:opacity-90"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {!isLoading && rows.length > 0 ? (
                <div className="mt-6 text-center text-sm text-slate-600">
                  Menampilkan {rows.length} data
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}