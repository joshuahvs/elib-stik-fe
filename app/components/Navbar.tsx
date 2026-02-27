"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export type NavbarItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

type NavbarProps = {
  items?: NavbarItem[];
  menuItems?: NavbarItem[];
};

export default function Navbar({ items, menuItems }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems: NavbarItem[] = items ?? [
    { label: "Beranda", href: "/" },
    { label: "Koleksi", href: "#", disabled: true },
    { label: "Isi Buku Tamu", href: "#", disabled: true },
    { label: "Akun", href: "/profile" },
  ];

  const hasMenu = Boolean(menuItems && menuItems.length > 0);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="w-full bg-white border-b">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="text-lg font-semibold text-slate-900">eLib</div>

        <nav className="flex items-center gap-8 text-sm text-slate-700">
          {navItems.slice(0, 3).map((item) => {
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

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={[
                "transition-colors hover:text-slate-900",
                hasMenu ? "" : "text-slate-400 cursor-not-allowed",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (!hasMenu) return;
                setOpen((v) => !v);
              }}
            >
              Menu
            </button>

            {hasMenu && open ? (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg overflow-hidden z-50">
                {menuItems!.map((mi) => (
                  <Link
                    key={mi.label}
                    href={mi.href}
                    className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    onClick={() => setOpen(false)}
                  >
                    {mi.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {(() => {
            const item = navItems[3];
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
          })()}
        </nav>
      </div>
    </header>
  );
}
