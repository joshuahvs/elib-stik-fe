"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/app/lib/api";

export type NavbarItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

type NavbarProps = {
  items?: NavbarItem[];
  menuItems?: NavbarItem[];
};

function getRole(me: any): string | undefined {
  return me?.role ?? me?.data?.role ?? me?.user?.role ?? undefined;
}

function getDisplayName(me: any): string | undefined {
  const raw = me?.nama_lengkap ?? undefined;

  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

export default function Navbar({ items }: NavbarProps) {
  const pathname = usePathname();

  const isLoginPage = pathname === "/auth/login";
  const isRegisterPage = pathname === "/auth/register";
  const isKunjunganPage = pathname === "/kunjungan";

  const useTransparentStyle = isLoginPage || isRegisterPage || isKunjunganPage;

  const [adminOpen, setAdminOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const adminCloseTimer = useRef<number | null>(null);
  const userCloseTimer = useRef<number | null>(null);

  const adminRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [me, setMe] = useState<any>(null);

  const role = getRole(me);
  const isAdmin = role === "admin";
  const displayName = getDisplayName(me) ?? "Akun";

  const navItems: NavbarItem[] = items ?? [
    { label: "Beranda", href: "/" },
    { label: "Koleksi", href: "/koleksi" },
    ...(isAuthed && role === "mahasiswa"
      ? [{ label: "Lihat Skripsi", href: "/skripsi" }]
      : []),
    ...(!isAdmin ? [{ label: "Isi Buku Tamu", href: "/kunjungan" }] : []),
  ];

  function cancelAdminClose() {
    if (adminCloseTimer.current != null) {
      window.clearTimeout(adminCloseTimer.current);
      adminCloseTimer.current = null;
    }
  }

  function cancelUserClose() {
    if (userCloseTimer.current != null) {
      window.clearTimeout(userCloseTimer.current);
      userCloseTimer.current = null;
    }
  }

  function scheduleAdminClose() {
    cancelAdminClose();
    adminCloseTimer.current = window.setTimeout(() => {
      setAdminOpen(false);
      adminCloseTimer.current = null;
    }, 180);
  }

  function scheduleUserClose() {
    cancelUserClose();
    userCloseTimer.current = window.setTimeout(() => {
      setUserOpen(false);
      userCloseTimer.current = null;
    }, 180);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedOutsideAdmin =
        !adminRef.current || !adminRef.current.contains(target);
      const clickedOutsideUser =
        !userRef.current || !userRef.current.contains(target);

      if (clickedOutsideAdmin && clickedOutsideUser) {
        setAdminOpen(false);
        setUserOpen(false);
        cancelAdminClose();
        cancelUserClose();
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      cancelAdminClose();
      cancelUserClose();
    };
  }, []);

  useEffect(() => {
    if (items) return;

    let cancelled = false;

    async function verify() {
      const token = window.localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setIsAuthed(false);
          setMe(null);
        }
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          window.localStorage.removeItem("token");
          if (!cancelled) {
            setIsAuthed(false);
            setMe(null);
          }
          return;
        }

        const data = await res.json().catch(() => null);

        if (!cancelled) {
          setIsAuthed(true);
          setMe(data);
        }
      } catch {
        if (!cancelled) {
          setIsAuthed(Boolean(token));
        }
      }
    }

    verify();

    function onStorage(e: StorageEvent) {
      if (e.key === "token") verify();
    }

    function onProfileUpdated() {
      verify();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("profile-updated", onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("profile-updated", onProfileUpdated);
    };
  }, [items, pathname]);

  return (
    <header
      className={[
        "w-full",
        useTransparentStyle
          ? "absolute top-0 left-0 z-50 bg-transparent border-b border-transparent"
          : "bg-white border-b",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div
          className={[
            "text-lg font-semibold",
            useTransparentStyle ? "text-white" : "text-slate-900",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          eLib
        </div>

        <nav
          className={[
            "flex items-center gap-8 text-sm",
            useTransparentStyle ? "text-white/90" : "text-slate-700",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {navItems.map((item) => {
            const isActive = item.href !== "#" && pathname === item.href;
            const className = [
              "transition-colors",
              item.disabled
                ? useTransparentStyle
                  ? "text-white/40 cursor-not-allowed"
                  : "text-slate-400 cursor-not-allowed"
                : useTransparentStyle
                  ? "hover:text-white"
                  : "hover:text-slate-900",
              isActive
                ? useTransparentStyle
                  ? "text-white font-semibold"
                  : "text-slate-900 font-semibold"
                : "",
            ]
              .filter(Boolean)
              .join(" ");

            if (item.disabled || item.href === "#") {
              return (
                <button
                  key={item.label}
                  type="button"
                  className={className}
                  onClick={(e) => e.preventDefault()}
                >
                  {item.label}
                </button>
              );
            }

            return (
              <Link key={item.label} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}

          {isAuthed && isAdmin ? (
            <div
              className="relative"
              ref={adminRef}
              onMouseEnter={() => {
                cancelAdminClose();
                setAdminOpen(true);
                setUserOpen(false);
              }}
              onMouseLeave={() => {
                scheduleAdminClose();
              }}
            >
              <button
                type="button"
                className="transition-colors hover:text-slate-900"
                onClick={() => {
                  cancelAdminClose();
                  setAdminOpen((v) => !v);
                  setUserOpen(false);
                }}
              >
                Data
              </button>

              {adminOpen ? (
                <>
                  <div className="absolute right-0 top-full h-2 w-52 bg-transparent z-40" />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-white shadow-lg overflow-hidden z-50">
                    <Link
                      href="/admin/login-logs"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setAdminOpen(false)}
                    >
                      Riwayat Login Pengguna
                    </Link>
                    <Link
                      href="/admin/landing-content"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setAdminOpen(false)}
                    >
                      Konten Landing Page
                    </Link>
                    <Link
                      href="/admin/users"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setAdminOpen(false)}
                    >
                      Daftar Pengguna
                    </Link>
                    <Link
                      href="/admin/borrowed-book-requests"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setAdminOpen(false)}
                    >
                      Peminjaman Buku
                    </Link>
                    <Link
                      href="/admin/books"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setAdminOpen(false)}
                    >
                      Tambah Buku
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {!isAuthed ? (
            <Link
              href="/auth/login"
              className={[
                "transition-colors",
                useTransparentStyle
                  ? "hover:text-white"
                  : "hover:text-slate-900",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              Masuk
            </Link>
          ) : (
            <div
              className="relative"
              ref={userRef}
              onMouseEnter={() => {
                cancelUserClose();
                setUserOpen(true);
                setAdminOpen(false);
              }}
              onMouseLeave={() => {
                scheduleUserClose();
              }}
            >
              <button
                type="button"
                className={[
                  "transition-colors hover:text-slate-900",
                  pathname.startsWith("/profile")
                    ? "text-slate-900 font-semibold"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  cancelUserClose();
                  setUserOpen((v) => !v);
                  setAdminOpen(false);
                }}
              >
                {displayName}
              </button>

              {userOpen ? (
                <>
                  <div className="absolute right-0 top-full h-2 w-56 bg-transparent z-40" />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setUserOpen(false)}
                    >
                      Profil
                    </Link>
                    <Link
                      href="/profile/books/borrowed-books"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setUserOpen(false)}
                    >
                      Buku Dipinjam
                    </Link>
                    <Link
                      href="/auth/logout"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setUserOpen(false)}
                    >
                      Keluar
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}