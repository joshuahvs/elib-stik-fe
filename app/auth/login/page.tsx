"use client";

import { type ChangeEvent, useState } from "react";
import { API_URL } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email dan password wajib diisi");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      const accessToken =
        (data as any)?.access_token ??
        (data as any)?.accessToken ??
        (data as any)?.token ??
        (data as any)?.session?.access_token ??
        (data as any)?.data?.session?.access_token;

      if (res.ok && accessToken) {
        localStorage.setItem("token", accessToken);
        router.push("/");
        return;
      }

      setError(getErrorMessage(data, "Login gagal"));
    } catch (e) {
      setError(getErrorMessage(e, "Terjadi kesalahan jaringan. Coba lagi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="relative min-h-screen">
        <div className="absolute inset-0 bg-[url('/bg-3.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/10" />

        <div className="relative min-h-screen grid grid-cols-1 md:grid-cols-2">
          <section className="hidden md:block" aria-hidden="true" />

          <section className="min-h-screen flex items-center justify-center px-6 py-10 pt-24">
            <div className="w-full max-w-md">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Masuk
              </h1>

              <ErrorMessage error={error} className="mb-4" />

              <div className="flex flex-col gap-4">
                <InputField
                  name="email"
                  type="email"
                  placeholder="E-mail"
                  onChange={handleChange}
                />

                <div className="relative">
                  <InputField
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    onChange={handleChange}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <div className="text-left">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-white/80 hover:text-white underline"
                  >
                    Lupa Kata Sandi?
                  </Link>
                </div>
              </div>

              <PrimaryButton
                onClick={handleLogin}
                type="button"
                className="mt-6 bg-black bg-none"
                disabled={isSubmitting}
                aria-disabled={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </PrimaryButton>

              <p className="text-center mt-4 text-white/80">
                Tidak punya akun?{" "}
                <Link
                  href="/auth/register"
                  className="underline hover:text-white"
                >
                  Buat akun.
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}