"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import Navbar from "@/app/components/Navbar";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    namaLengkap: "Nama Lengkap",
    username: "",
    email: "",
    nomorTelepon: "",
    tanggalLahir: "",
    nim: "",
    nomorDosen: "",
  });

  useEffect(() => {
    const nextToken = localStorage.getItem("token");
    setToken(nextToken);
    if (!nextToken) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${nextToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setForm((prev) => ({
          ...prev,
          namaLengkap:
            data?.nama_lengkap ??
            prev.namaLengkap,
          username: data?.username ?? prev.username,
          email: data?.email ?? prev.email,
          nomorTelepon: data?.phone,
          tanggalLahir:
            data?.tanggal_lahir ?? data?.tanggalLahir ?? prev.tanggalLahir,
          nim: data?.nim ?? prev.nim,
          nomorDosen: data?.nomor_dosen ?? data?.nomorDosen ?? prev.nomorDosen,
        }));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const role: string | undefined =
    user?.role ?? user?.data?.role ?? user?.user?.role ?? undefined;

  const roleLabel = useMemo(() => {
    if (!role) return "";
    if (role === "mahasiswa") return "Mahasiswa";
    if (role === "dosen") return "Dosen";
    if (role === "umum") return "Umum";
    return String(role);
  }, [role]);

  const displayName = useMemo(() => {
    return form.namaLengkap?.trim() ? form.namaLengkap : "Nama Lengkap";
  }, [form.namaLengkap]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!isLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Akun</h1>
            <p className="mt-2 text-slate-600">
              Kamu belum login. Silakan masuk untuk melihat profil.
            </p>
            <div className="mt-6">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="max-w-xl mx-auto text-center text-slate-600">
            Memuat profil…
          </div>
        ) : null}

        {!isLoading && token ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <section className="flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <div className="w-44 h-44 rounded-full border flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-slate-100" />
                </div>

                <h1 className="mt-6 text-4xl font-bold text-slate-900 text-center">
                  {displayName}
                </h1>
                {roleLabel ? (
                  <p className="mt-2 text-slate-500 font-medium text-center">
                    {roleLabel}
                  </p>
                ) : null}

                <div className="mt-8 w-full max-w-sm">
                  <PrimaryButton type="button">Ubah Profil</PrimaryButton>
                </div>
              </div>
            </section>

            <section className="w-full">
              <div className="rounded-2xl border p-8 lg:p-10">
                <div className="flex flex-col gap-4">
                  {role === "mahasiswa" ? (
                    <InputField
                      label="NIM"
                      name="nim"
                      placeholder="NIM"
                      value={form.nim}
                      onChange={handleChange}
                    />
                  ) : null}

                  {role === "dosen" ? (
                    <InputField
                      label="Nomor Dosen"
                      name="nomorDosen"
                      placeholder="Nomor Dosen"
                      value={form.nomorDosen}
                      onChange={handleChange}
                    />
                  ) : null}

                  <InputField
                    label="Nama Lengkap"
                    name="namaLengkap"
                    placeholder="Nama Lengkap"
                    value={form.namaLengkap}
                    onChange={handleChange}
                  />

                  <InputField
                    label="Username"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                  />

                  <InputField
                    label="E-mail"
                    name="email"
                    type="email"
                    placeholder="E-mail"
                    value={form.email}
                    onChange={handleChange}
                  />

                  <InputField
                    label="Tanggal Lahir"
                    name="tanggalLahir"
                    placeholder="00/00/0000"
                    value={form.tanggalLahir}
                    onChange={handleChange}
                  />

                  <InputField
                    label="Nomor Telepon"
                    name="nomorTelepon"
                    placeholder="0000000000"
                    value={form.nomorTelepon}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
