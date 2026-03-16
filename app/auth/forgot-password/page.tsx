"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/app/lib/api";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage from "@/app/components/ErrorMessage";

type Status = "idle" | "submitting" | "success" | "error";

export default function ForgotPasswordPage() {
  const endpointPath = useMemo(() => "/auth/forgot-password", []);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus("error");
      setMessage("Email wajib diisi");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}${endpointPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res
        .json()
        .catch(() => ({ message: "Request failed" }) as { message?: string });

      if (res.ok) {
        setStatus("success");
        setMessage(
          "Jika email terdaftar, link untuk reset password akan dikirim ke email tersebut.",
        );
        return;
      }

      const errMsg =
        (data as any)?.message ??
        (data as any)?.error ??
        (data as any)?.msg ??
        "Gagal mengirim permintaan reset password";

      setStatus("error");
      setMessage(String(errMsg));
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan jaringan. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-slate-900">
            Lupa Password
          </h1>
          <p className="text-center text-sm text-slate-600 mb-6">
            Masukkan email kamu untuk menerima link reset.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={handleChange}
              autoComplete="email"
            />

            {message ? (
              status === "error" ? (
                <ErrorMessage error={message} />
              ) : (
                <div
                  className={[
                    "text-sm rounded-lg p-3 border",
                    status === "success"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-slate-50 border-slate-200 text-slate-700",
                  ].join(" ")}
                  role={status === "success" ? "status" : "status"}
                >
                  {message}
                </div>
              )
            ) : null}

            <PrimaryButton
              type="submit"
              disabled={status === "submitting"}
              aria-disabled={status === "submitting"}
            >
              {status === "submitting" ? "Mengirim..." : "Kirim Link Reset"}
            </PrimaryButton>

            <p className="text-center text-gray-500">
              <Link href="/auth/login" className="underline">
                Kembali ke halaman login
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
