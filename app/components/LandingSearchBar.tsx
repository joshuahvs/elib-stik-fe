"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    const target = trimmed
      ? `/koleksi?q=${encodeURIComponent(trimmed)}`
      : "/koleksi";
    router.push(target);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-2.5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.65)] backdrop-blur sm:flex-row sm:items-center"
    >
      <label htmlFor="landing-search" className="sr-only">
        Cari koleksi
      </label>
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          id="landing-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari judul, penulis, subjek, atau ISBN"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/60 outline-none transition focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-[#F59E0B]/60"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-[#2A170C] shadow-[0_18px_35px_-22px_rgba(245,158,11,0.7)] transition hover:bg-[#FBBF24] active:scale-[0.98]"
      >
        Cari Koleksi
      </button>
    </form>
  );
}
