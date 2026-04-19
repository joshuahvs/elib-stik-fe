"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";
import Dropdown from "@/app/components/DropDown";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const roleOptions = useMemo(
    () => [
      { label: "Mahasiswa", value: "mahasiswa" as const },
      { label: "Dosen", value: "dosen" as const },
      { label: "Umum", value: "umum" as const },
    ],
    [],
  );

  const [role, setRole] =
    useState<(typeof roleOptions)[number]["value"]>("mahasiswa");
  const [form, setForm] = useState({
    nama_lengkap: "",
    username: "",
    phone: "",
    password: "",
    nim: "",
    nomor_dosen: "",
    email: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectedRoleLabel =
    roleOptions.find((o) => o.value === role)?.label ?? role;

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nim: role === "mahasiswa" ? prev.nim : "",
      nomor_dosen: role === "dosen" ? prev.nomor_dosen : "",
    }));
  }, [role]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async () => {
    if (
      !form.nama_lengkap.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password.trim()
    ) {
      setError("Semua field wajib diisi");
      return;
    }

    if (role === "mahasiswa" && !form.nim.trim()) {
      setError("NIM wajib diisi untuk mahasiswa");
      return;
    }

    if (role === "dosen" && !form.nomor_dosen.trim()) {
      setError("Nomor dosen wajib diisi untuk dosen");
      return;
    }

    const passwordPolicy =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPolicy.test(form.password)) {
      setError(
        "Password minimal 8 karakter dan wajib mengandung huruf kecil, huruf besar, angka, dan simbol",
      );
      return;
    }

    const body: any = {
      nama_lengkap: form.nama_lengkap,
      username: form.username,
      phone: form.phone,
      email: form.email,
      password: form.password,
      role,
    };

    if (role === "mahasiswa") body.nim = form.nim;
    if (role === "dosen") body.nomor_dosen = form.nomor_dosen;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setSuccess(
          typeof (data as any)?.message === "string"
            ? (data as any).message
            : "Registrasi berhasil. Silakan login.",
        );
        return;
      }

      setError(getErrorMessage(data, "Registrasi gagal"));
    } catch (e) {
      setError(getErrorMessage(e, "Terjadi kesalahan jaringan. Coba lagi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="relative min-h-screen">
        {/* Single background image for the whole page */}
        <div className="absolute inset-0 bg-[url('/bg-3.png')] bg-cover bg-center" />

        {/* Overlays to mimic the split look while keeping one image */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/25" />
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-black/35" />
          </div>
        </div>

        <div className="relative min-h-screen grid grid-cols-1 md:grid-cols-2">
          <section className="hidden md:block" aria-hidden="true" />

          <section className="min-h-screen flex items-center justify-center px-6 py-10 pt-24">
            <div className="w-full max-w-md">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Registrasi
              </h1>

              <ErrorMessage error={error} className="mb-4" />

              {success ? (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  {success}
                </div>
              ) : null}

              <div className="mb-5">
                <Dropdown
                  label="Peran *"
                  options={roleOptions.map((o) => o.label)}
                  value={selectedRoleLabel}
                  labelClassName="text-white/80"
                  valueClassName="text-slate-900"
                  buttonClassName="bg-white"
                  onChange={(label) => {
                    const next = roleOptions.find(
                      (o) => o.label === label,
                    )?.value;
                    setRole(next ?? "umum");
                  }}
                />
              </div>

              <div className="flex flex-col gap-4">
                <InputField
                  label="Nama Lengkap *"
                  labelClassName="text-white/80"
                  name="nama_lengkap"
                  placeholder="Nama Lengkap"
                  onChange={handleChange}
                  value={form.nama_lengkap}
                  required
                />

                <InputField
                  label="Username *"
                  labelClassName="text-white/80"
                  name="username"
                  placeholder="Username"
                  onChange={handleChange}
                  value={form.username}
                  required
                />

                <InputField
                  label="Nomor Telepon *"
                  labelClassName="text-white/80"
                  name="phone"
                  placeholder="0000000000"
                  onChange={handleChange}
                  value={form.phone}
                  required
                />

                <InputField
                  label="E-mail *"
                  labelClassName="text-white/80"
                  name="email"
                  type="email"
                  placeholder="E-mail"
                  onChange={handleChange}
                  value={form.email}
                  required
                />

                {role === "mahasiswa" && (
                  <InputField
                    label="NIM *"
                    labelClassName="text-white/80"
                    name="nim"
                    placeholder="NIM"
                    onChange={handleChange}
                    value={form.nim}
                    required
                  />
                )}

                {role === "dosen" && (
                  <InputField
                    label="Nomor Dosen *"
                    labelClassName="text-white/80"
                    name="nomor_dosen"
                    placeholder="Nomor Dosen"
                    onChange={handleChange}
                    value={form.nomor_dosen}
                    required
                  />
                )}

                <InputField
                  label="Kata Sandi *"
                  labelClassName="text-white/80"
                  name="password"
                  type="password"
                  placeholder="Kata Sandi"
                  onChange={handleChange}
                  value={form.password}
                  required
                />
                <div className="relative">
                  <InputField
                    label="Kata Sandi *"
                    labelClassName="text-white/80"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Kata Sandi"
                    onChange={handleChange}
                    value={form.password}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[65%] -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <div className="text-xs text-white/80 rounded-xl bg-black/35 border border-white/10 p-3">
                  <p className="mb-1">Password harus terdiri dari:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Minimal 8 karakter</li>
                    <li>Minimal 1 huruf besar</li>
                    <li>Minimal 1 huruf kecil</li>
                    <li>Minimal 1 angka</li>
                    <li>Minimal 1 simbol</li>
                  </ul>
                </div>
              </div>

              <PrimaryButton
                onClick={handleSubmit}
                type="button"
                className="mt-6 bg-black bg-none"
                disabled={isSubmitting}
                aria-disabled={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Buat Akun"}
              </PrimaryButton>

              <p className="text-center mt-4 text-white/80">
                Sudah punya akun?{" "}
                <Link href="/auth/login" className="underline hover:text-white">
                  Masuk.
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}