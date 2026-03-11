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
  const raw =
    me?.nama_lengkap ??
    undefined;

  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

export default function Navbar({ items, menuItems }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const adminCloseTimer = useRef<number | null>(null);
  const userCloseTimer = useRef<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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

  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    // Optimistic initial value to avoid a flash after hydration.
    // Still verified against backend below.
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem("token"));
  });

  const [me, setMe] = useState<any>(null);

  const navItems: NavbarItem[] = items ?? [
    { label: "Beranda", href: "/" },
    { label: "Koleksi", href: "#", disabled: true },
    { label: "Isi Buku Tamu", href: "#", disabled: true },
  ];

  const hasMenu = Boolean(menuItems && menuItems.length > 0);
  const role = getRole(me);
  const isAdmin = role === "admin";
  const displayName = getDisplayName(me) ?? "Akun";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedOutsideMenu =
        !menuRef.current || !menuRef.current.contains(target);
      const clickedOutsideAdmin =
        !adminRef.current || !adminRef.current.contains(target);
      const clickedOutsideUser =
        !userRef.current || !userRef.current.contains(target);

      if (clickedOutsideMenu && clickedOutsideAdmin && clickedOutsideUser) {
        setOpen(false);
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
    if (items) return; // if caller provides nav items, don't override/auth-check

    let cancelled = false;

    async function verify() {
      const token = window.localStorage.getItem("token");
      if (!token) {
        if (!cancelled) setIsAuthed(false);
        if (!cancelled) setMe(null);
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
          if (!cancelled) setIsAuthed(false);
          if (!cancelled) setMe(null);
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

    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [API_URL, items, pathname]);

  return (
    <header className="w-full bg-white border-b">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">eLib</div>

        <nav className="flex items-center gap-8 text-sm text-slate-700">
          {navItems.map((item) => {
            const isActive = item.href !== "#" && pathname === item.href;
            const className = [
              "transition-colors",
              item.disabled
                ? "text-slate-400 cursor-not-allowed"
                : "hover:text-slate-900",
              isActive ? "text-slate-900 font-semibold" : "",
            ]
              .filter(Boolean)
              .join(" ");

            if (item.disabled || item.href === "#") {
              return (
                <button
                  key={item.label}
                  type="button"
                  className={className}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
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
                setOpen(false);
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
                  setOpen(false);
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
                      Login Logs
                    </Link>
                    <Link
                      href="/admin/users"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setAdminOpen(false)}
                    >
                      Users
                    </Link>
                    <Link
                      href="/admin/borrowed-book-requests"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setAdminOpen(false)}
                    >
                      Peminjaman Buku
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {!isAuthed ? (
            <Link
              href="/auth/login"
              className="transition-colors hover:text-slate-900"
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
                setOpen(false);
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
                  setOpen(false);
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
                      Riwayat Peminjaman
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