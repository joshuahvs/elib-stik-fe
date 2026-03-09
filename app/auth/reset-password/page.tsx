"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/app/lib/api";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";

function parseHashParams(hash: string): Record<string, string> {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(clean);
  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const endpointPath = useMemo(() => "/auth/reset-password", []);

  const [hashParams, setHashParams] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const parsed = parseHashParams(window.location.hash);
    setHashParams(parsed);

    // Remove sensitive token from URL as early as possible.
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  const data = useMemo(() => {
    const query: Record<string, string> = {};
    for (const [k, v] of searchParams.entries()) query[k] = v;
    return { ...query, ...hashParams };
  }, [searchParams, hashParams]);

  const accessToken = data.access_token;
  const type = data.type;
  const tokenHash = data.token_hash || data.token || data.code;

  const isRecoveryLink =
    Boolean(tokenHash) && (type ? type === "recovery" : true);

  const hasAccessTokenHashFlow = Boolean(accessToken) && !tokenHash;

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!tokenHash) {
      setStatus("error");
      setMessage(
        "Token reset password (token_hash) tidak ditemukan. Pastikan membuka link terbaru dari email.",
      );
      return;
    }

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setStatus("error");
      setMessage("Password baru wajib diisi");
      return;
    }

    if (trimmedPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi password tidak sama");
      return;
    }

    const passwordPolicy =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPolicy.test(trimmedPassword)) {
      setStatus("error");
      setMessage(
        "Password minimal 8 karakter dan wajib mengandung huruf kecil, huruf besar, angka, dan simbol",
      );
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}${endpointPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          token_hash: tokenHash,
          new_password: trimmedPassword,
          type,
        }),
      });

      const responseBody = await res
        .json()
        .catch(() => ({ message: "Request failed" }) as { message?: string });

      if (res.ok) {
        setStatus("success");
        setMessage(
          "Password berhasil diubah. Silakan login dengan password baru.",
        );

        window.setTimeout(() => {
          router.replace("/auth/login");
        }, 2000);
        return;
      }

      const errMsg =
        (responseBody as any)?.message ??
        (responseBody as any)?.error ??
        (responseBody as any)?.msg ??
        "Gagal mengubah password";

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
            Reset Password
          </h1>
          <p className="text-center text-sm text-slate-600 mb-6">
            Masukkan password baru untuk akun kamu.
          </p>

          {!isRecoveryLink ? (
            <div className="text-center">
              <p className="text-red-700 font-medium">Link tidak valid</p>
              <p className="text-slate-600 mt-2">
                Link reset password tidak berisi token yang dibutuhkan.
              </p>

              {hasAccessTokenHashFlow ? (
                <p className="text-slate-600 mt-2">
                  Link yang kamu buka berisi{" "}
                  <span className="font-mono">access_token</span>
                  (hash <span className="font-mono">#...</span>), sementara
                  backend kamu meminta
                  <span className="font-mono"> token_hash</span>. Supaya cocok
                  dengan DTO backend, pastikan link dari email mengarah ke:
                  <span className="font-mono">
                    {" "}
                    /auth/reset-password?token_hash=...&amp;type=recovery
                  </span>
                  .
                </p>
              ) : null}

              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/auth/forgot-password"
                  className="underline text-slate-900"
                >
                  Kirim ulang link
                </Link>
                <span className="text-slate-300">|</span>
                <Link href="/auth/login" className="underline text-slate-900">
                  Kembali ke login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <InputField
                name="password"
                type="password"
                placeholder="Password baru"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
              />

              <InputField
                name="confirmPassword"
                type="password"
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChange={handleConfirmChange}
                autoComplete="new-password"
              />

              {message ? (
                <div
                  className={[
                    "text-sm rounded-lg p-3 border",
                    status === "success"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : status === "error"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-slate-50 border-slate-200 text-slate-700",
                  ].join(" ")}
                  role={status === "error" ? "alert" : "status"}
                >
                  {message}
                </div>
              ) : null}

              <PrimaryButton type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Menyimpan..." : "Simpan Password"}
              </PrimaryButton>

              <p className="text-center text-gray-500">
                <Link href="/auth/login" className="underline">
                  Kembali ke halaman login
                </Link>
              </p>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}
