"use client";

import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";
import Dropdown from "@/app/components/DropDown";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
// import svgPaths from "./svg-ixvtyevhx6";
// import imgDivPageTitle from "figma:asset/d0c9d215a346aec1ae0c7a18cabe6d7b40d61a0d.png";
// import imgEllipse1 from "figma:asset/55e34b03a7cad2686e88400e57a2c55497abfbb4.png";
// import imgEllipse2 from "figma:asset/bc8f6993dee3236cf194e68c4b00b842f6bca899.png";
// import imgEllipse3 from "figma:asset/2924c8ba64cb1119fe29c2aeb8dfa7caeef6b9df.png";
// import imgSapiens from "figma:asset/8a522ab444d99d493144f6b25000c0afc4b34a09.png";

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
      <header className="w-full bg-white border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-900">eLib</div>
          <Link
            href="/auth/login"
            className="bg-black text-white px-5 py-2 rounded-full text-sm"
          >
            Masuk
          </Link>
        </div>
      </header>

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
