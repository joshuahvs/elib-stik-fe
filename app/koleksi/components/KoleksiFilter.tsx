"use client";

import { useEffect, useState, useRef } from "react";
import {
  fetchKoleksiCategories,
  fetchKoleksiYears,
  fetchKoleksiSubjects,
  fetchKoleksiSubjectsAll,
} from "@/app/lib/koleksi";

interface Subject {
  value: string;
  count: number;
}

interface KoleksiFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedKetersediaan: string;
  onKetersediaanChange: (ketersediaan: string) => void;
  selectedTahun: string[];
  onTahunChange: (tahun: string) => void;
  selectedSubjeks: string[];
  onSubjekChange: (subjek: string) => void;
  onResetFilters?: () => void;
}

export default function KoleksiFilter({
  selectedCategory,
  onCategoryChange,
  selectedKetersediaan,
  onKetersediaanChange,
  selectedTahun,
  onTahunChange,
  selectedSubjeks,
  onSubjekChange,
  onResetFilters,
}: KoleksiFilterProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [years, setYears] = useState<number[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);

  const [subjects, setSubjects] = useState<Record<string, Subject[]>>({});
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // All subjects for search (without minimum count filter)
  const [allSubjectsForSearch, setAllSubjectsForSearch] = useState<Subject[]>(
    [],
  );
  const [isLoadingAllSubjects, setIsLoadingAllSubjects] = useState(true);

  const [subjekSearchInput, setSubjekSearchInput] = useState("");
  const [subjekDropdownOpen, setSubjekDropdownOpen] = useState(false);
  const [tahunDropdownOpen, setTahunDropdownOpen] = useState(false);
  const subjekSearchRef = useRef<HTMLDivElement>(null);
  const tahunDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, yearsRes, subjectsRes, allSubjectsRes] =
          await Promise.all([
            fetchKoleksiCategories(),
            fetchKoleksiYears(),
            fetchKoleksiSubjects(),
            fetchKoleksiSubjectsAll(),
          ]);

        setCategories(categoriesRes.data);
        setYears(yearsRes.data);
        setSubjects(subjectsRes.data);
        setAllSubjectsForSearch(allSubjectsRes.data);
      } catch (error) {
        console.error("Failed to load filter options:", error);
        setCategories([]);
        setYears([]);
        setSubjects({});
        setAllSubjectsForSearch([]);
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingYears(false);
        setIsLoadingSubjects(false);
        setIsLoadingAllSubjects(false);
      }
    };

    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subjekSearchRef.current &&
        !subjekSearchRef.current.contains(event.target as Node)
      ) {
        setSubjekDropdownOpen(false);
      }
      if (
        tahunDropdownRef.current &&
        !tahunDropdownRef.current.contains(event.target as Node)
      ) {
        setTahunDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter subjects based on search input from ALL subjects (no minimum count restriction)
  const getFilteredSubjects = () => {
    if (!subjekSearchInput.trim()) return [];

    const searchLower = subjekSearchInput.toLowerCase();

    return allSubjectsForSearch
      .filter((subject) => subject.value.toLowerCase().includes(searchLower))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Limit to 15 results
  };

  const filteredSubjects = getFilteredSubjects();

  const selectClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#6b3a22] focus:bg-white focus:ring-4 focus:ring-[#6b3a22]/15";

  const handleSubjekSelect = (subjekValue: string) => {
    onSubjekChange(subjekValue);
    setSubjekSearchInput("");
    setSubjekDropdownOpen(false);
  };

  const hasActiveFilters = Boolean(
    selectedCategory ||
    selectedTahun.length > 0 ||
    selectedKetersediaan !== "Semua" ||
    selectedSubjeks.length > 0 ||
    subjekSearchInput,
  );

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.2)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6b3a22]/10 text-[#6b3a22]">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h18l-7 8v5l-4 2v-7L3 5z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
              Filter
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Saring koleksi sesuai kebutuhan Anda.
            </p>
          </div>
        </div>
        {(selectedCategory ||
          selectedTahun.length > 0 ||
          selectedKetersediaan !== "Semua" ||
          selectedSubjeks.length > 0) &&
          onResetFilters && (
            <button
              onClick={onResetFilters}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-[#6b3a22] hover:text-[#6b3a22]"
            >
              Hapus Semua Filter
            </button>
          )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Kategori/Jenis Koleksi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Jenis Koleksi
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={selectClass}
            disabled={isLoadingCategories}
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Ketersediaan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Ketersediaan
          </label>
          <select
            value={selectedKetersediaan}
            onChange={(e) => onKetersediaanChange(e.target.value)}
            className={selectClass}
          >
            {["Semua", "Tersedia", "Dipinjam"].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Tahun Terbit - Multi-select like Subjek */}
        <div className="relative flex flex-col gap-1.5" ref={tahunDropdownRef}>
          <label className="text-xs font-semibold text-slate-600">
            Tahun Terbit
          </label>
          <button
            type="button"
            onClick={() => setTahunDropdownOpen((prev) => !prev)}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition hover:border-slate-300"
          >
            {selectedTahun.length === 0 ? (
              <span className="text-slate-500">Semua Tahun</span>
            ) : (
              <span>{selectedTahun.length} tahun dipilih</span>
            )}
            <span className="text-xs text-slate-400">v</span>
          </button>
          {tahunDropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
              {isLoadingYears ? (
                <div className="px-3 py-2 text-xs text-slate-500">
                  Loading...
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {years.map((year) => {
                    const isSelected = selectedTahun.includes(year.toString());
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => onTahunChange(year.toString())}
                        className={`w-full text-left px-3 py-2 text-sm transition ${
                          isSelected
                            ? "bg-[#6b3a22]/10 text-[#6b3a22] font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-emerald-600">✓</span>
                          )}
                          {year}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subjek Dropdown - Grouped (Count >= 5) */}
        {/* <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            Subjek (Populer)
          </label>
          <select
            className={selectClass}
            disabled={isLoadingSubjects}
            onChange={(e) => {
              if (e.target.value !== "Semua") {
                onSubjekChange(e.target.value);
              }
              e.target.value = "Semua";
            }}
          >
            <option value="Semua">Pilih Subjek Populer</option>
            {Object.entries(subjects).map(([parent, subjectsList]) => (
              <optgroup key={parent} label={parent}>
                {subjectsList.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.value === "*others"
                      ? "Subjek Lainnya"
                      : subject.value}{" "}
                    ({subject.count})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div> */}

        {/* Subjek Search Input with Live Dropdown - Multi-select */}
        <div
          className="relative flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 md:col-span-2 xl:col-span-3"
          ref={subjekSearchRef}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Cari & Pilih Subjek (Multi)
            </label>
            <span className="text-[11px] text-slate-400">Maks. 15 hasil</span>
          </div>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
              type="text"
              placeholder="Ketik subjek, bisa pilih lebih dari 1"
              value={subjekSearchInput}
              onChange={(e) => {
                setSubjekSearchInput(e.target.value);
                setSubjekDropdownOpen(e.target.value.length > 0);
              }}
              onFocus={() =>
                subjekSearchInput.length > 0 && setSubjekDropdownOpen(true)
              }
              className={`${selectClass} cursor-text bg-white pl-10`}
              disabled={isLoadingAllSubjects}
            />
          </div>

          {/* Live Search Dropdown - ALL subjects (no restrictions) */}
          {subjekDropdownOpen && filteredSubjects.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {filteredSubjects.map((subject) => {
                const isSelected = selectedSubjeks.includes(subject.value);
                return (
                  <button
                    key={subject.value}
                    type="button"
                    onClick={() => handleSubjekSelect(subject.value)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && (
                        <span className="text-emerald-600">✓</span>
                      )}
                      {subject.value === "*others"
                        ? "Subjek Lainnya"
                        : subject.value}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      ({subject.count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {subjekSearchInput && (
            <button
              type="button"
              onClick={() => setSubjekSearchInput("")}
              className="mt-1 w-fit text-xs font-semibold text-slate-500 transition hover:text-slate-700"
            >
              Bersihkan
            </button>
          )}
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Filter Aktif
          </span>
          {selectedCategory && (
            <span className="flex items-center gap-1 rounded-full border border-[#6b3a22]/20 bg-[#6b3a22]/10 px-3 py-1 text-xs font-semibold text-[#6b3a22]">
              {selectedCategory}
              <button
                onClick={() => onCategoryChange("")}
                className="ml-1 leading-none hover:text-[#6b3a22]/70"
              >
                ×
              </button>
            </span>
          )}
          {selectedKetersediaan !== "Semua" && (
            <span className="flex items-center gap-1 rounded-full border border-[#6b3a22]/20 bg-[#6b3a22]/10 px-3 py-1 text-xs font-semibold text-[#6b3a22]">
              {selectedKetersediaan}
              <button
                onClick={() => onKetersediaanChange("Semua")}
                className="ml-1 leading-none hover:text-[#6b3a22]/70"
              >
                ×
              </button>
            </span>
          )}
          {selectedTahun.length > 0 &&
            selectedTahun.map((tahun) => (
              <span
                key={tahun}
                className="flex items-center gap-1 rounded-full border border-[#6b3a22]/20 bg-[#6b3a22]/10 px-3 py-1 text-xs font-semibold text-[#6b3a22]"
              >
                {tahun}
                <button
                  onClick={() => onTahunChange(tahun)}
                  className="ml-1 leading-none hover:text-[#6b3a22]/70"
                >
                  ×
                </button>
              </span>
            ))}
          {selectedSubjeks.length > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-[#6b3a22]/20 bg-[#6b3a22]/10 px-3 py-1 text-xs font-semibold text-[#6b3a22]">
              {selectedSubjeks.length} Subjek Dipilih
              <button
                onClick={() => {
                  selectedSubjeks.forEach((s) => onSubjekChange(s));
                }}
                className="ml-1 leading-none hover:text-[#6b3a22]/70"
              >
                ×
              </button>
            </span>
          )}
          {subjekSearchInput && (
            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Cari: "{subjekSearchInput}"
              <button
                onClick={() => setSubjekSearchInput("")}
                className="ml-1 leading-none hover:text-slate-500"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Selected subjek pills */}
      {selectedSubjeks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          {selectedSubjeks.map((subjek) => (
            <span
              key={subjek}
              className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              {subjek}
              <button
                onClick={() => onSubjekChange(subjek)}
                className="ml-1 leading-none hover:text-emerald-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
