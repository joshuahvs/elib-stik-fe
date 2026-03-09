"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";
import Dropdown from "@/app/components/DropDown";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";

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
    nama_lengkap:"",
    username: "",
    phone: "",
    password: "",
    nim: "",
    nomor_dosen: "",
    email: "",
  });

  const selectedRoleLabel =
    roleOptions.find((o) => o.value === role)?.label ?? role;

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nim: role === "mahasiswa" ? prev.nim : "",
      nomor_dosen: role === "dosen" ? prev.nomor_dosen : "",
    }));
  }, [role]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.phone.trim()) {
      alert("Email dan nomor telepon wajib diisi");
      return;
    }

    const passwordPolicy =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPolicy.test(form.password)) {
      alert(
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

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    alert(JSON.stringify(data));
  };

  return (
    <div className="min-h-screen bg-white">

      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-900">
            Buat Akun
          </h1>

          <div className="mb-5">
            <Dropdown
              label="Role"
              options={roleOptions.map((o) => o.label)}
              value={selectedRoleLabel}
              onChange={(label) => {
                const next = roleOptions.find((o) => o.label === label)?.value;
                setRole(next ?? "umum");
              }}
            />
          </div>

          <div className="flex flex-col gap-4">
            <InputField
              name="nama_lengkap"
              placeholder="Nama Lengkap"
              onChange={handleChange}
            />

            <InputField
              name="username"
              placeholder="Username"
              onChange={handleChange}
            />

            <InputField
              name="phone"
              placeholder="No. Telepon"
              onChange={handleChange}
            />

            <InputField
              name="email"
              placeholder="Email"
              onChange={handleChange}
            />

            <InputField
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
            />

            {role === "mahasiswa" && (
              <InputField
                name="nim"
                placeholder="NIM"
                onChange={handleChange}
              />
            )}

            {role === "dosen" && (
              <InputField
                name="nomor_dosen"
                placeholder="Nomor Dosen"
                onChange={handleChange}
              />
            )}
          </div>

          <PrimaryButton onClick={handleSubmit} type="button" className="mt-6">
            Daftar
          </PrimaryButton>

          <p className="text-center mt-4 text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="underline">
              Masuk
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
