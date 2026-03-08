"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/app/components/PrimaryButton";
import { API_URL } from "@/app/lib/api";
import Navbar from "@/app/components/Navbar";

export default function LogoutConfirmPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const isLoggedIn = useMemo(() => Boolean(token), [token]);

  const handleCancel = () => {
    router.push("/profile")
  };

  const handleSignOut = async () => {
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      localStorage.removeItem("token");

      if (!res.ok) {
        const msg = (data as any)?.message ?? "Gagal Keluar";
        alert(msg);
        router.replace("/auth/login");
        return;
      }

      alert("Berhasil Keluar.");
      router.replace("/auth/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen">
        {/* Background image */}
        <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-2.png')" }}
        />
        
        {/* Navbar */}
        <div className="relative z-20">
            <Navbar />
        </div>
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl bg-white/85 backdrop-blur-md shadow-2xl p-10 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">
            Keluar dari akun Anda?
            </h1>
            <p className="mt-3 text-slate-700">
            Anda perlu masuk kembali untuk melanjutkan.
            </p>

            <div className="mt-8 flex flex-col gap-4">
            <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60"
            >
                Kembali
            </button>

            <PrimaryButton
                onClick={handleSignOut}
                type="button"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Sedang keluar..." : "Keluar"}
            </PrimaryButton>
            </div>
        </div>
        </div>
    </div>
    );
}