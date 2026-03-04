"use client";

import { type ChangeEvent, useState } from "react";
import { API_URL } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      alert("Email dan password wajib diisi");
      return;
    }

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res
      .json()
      .catch(() => ({ message: "Login failed" }) as { message?: string });

    const accessToken =
      (data as any)?.access_token ??
      (data as any)?.accessToken ??
      (data as any)?.token ??
      (data as any)?.session?.access_token ??
      (data as any)?.data?.session?.access_token;

    if (res.ok && accessToken) {
      localStorage.setItem("token", accessToken);
      alert("Login success!");
      router.push("/profile");
      return;
    }

    const message =
      (data as any)?.message ??
      (data as any)?.error ??
      (data as any)?.msg ??
      "Login failed";
    alert(message);
  };

  return (
    <div className="min-h-screen bg-white">

      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-900">
            Masuk
          </h1>

          <div className="flex flex-col gap-4">
            <InputField
              name="email"
              type="email"
              placeholder="Email"
              onChange={handleChange}
            />

            <InputField
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
            />
          </div>

          <PrimaryButton onClick={handleLogin} type="button" className="mt-6">
            Masuk
          </PrimaryButton>

          <p className="text-center mt-4 text-gray-500">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="underline">
              Daftar
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
