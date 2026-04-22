"use client";

import { useEffect, useState, useRef } from "react";
import { fetchKoleksiCategories, fetchKoleksiYears, fetchKoleksiSubjects, fetchKoleksiSubjectsAll } from "@/app/lib/koleksi";

interface Subject {
  value: string;
  count: number;
}

interface KoleksiFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedKetersediaan: string;
  onKetersediaanChange: (ketersediaan: string) => void;
  selectedTahun: string;
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
  const [allSubjectsForSearch, setAllSubjectsForSearch] = useState<Subject[]>([]);
  const [isLoadingAllSubjects, setIsLoadingAllSubjects] = useState(true);
  
  const [subjekSearchInput, setSubjekSearchInput] = useState("");
  const [subjekDropdownOpen, setSubjekDropdownOpen] = useState(false);
  const subjekSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, yearsRes, subjectsRes, allSubjectsRes] = await Promise.all([
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
      if (subjekSearchRef.current && !subjekSearchRef.current.contains(event.target as Node)) {
        setSubjekDropdownOpen(false);
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
      .filter((subject) =>
        subject.value.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Limit to 15 results
  };

  const filteredSubjects = getFilteredSubjects();

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#6b3a22] focus:ring-2 focus:ring-[#6b3a22]/20 cursor-pointer";

  const handleSubjekSelect = (subjekValue: string) => {
    onSubjekChange(subjekValue);
    setSubjekSearchInput("");
    setSubjekDropdownOpen(false);
  };

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Filter
        </p>
        {(selectedCategory || selectedTahun !== "Semua" || selectedKetersediaan !== "Semua" || selectedSubjeks.length > 0) && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-medium text-slate-500 hover:text-[#6b3a22] transition"
          >
            Hapus Semua Filter
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {/* Kategori/Jenis Koleksi */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Jenis Koleksi</label>
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
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Ketersediaan</label>
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

        {/* Tahun Terbit */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Tahun Terbit</label>
          <select
            value={selectedTahun}
            onChange={(e) => onTahunChange(e.target.value)}
            className={selectClass}
            disabled={isLoadingYears}
          >
            <option value="Semua">Semua Tahun</option>
            {years.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Subjek Dropdown - Grouped (Count >= 5) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Subjek (Populer)</label>
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
            <option value="Semua">-- Pilih Subjek Populer --</option>
            {Object.entries(subjects).map(([parent, subjectsList]) => (
              <optgroup key={parent} label={parent}>
                {subjectsList.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.value === '*others' ? `Subjek Lainnya` : subject.value} ({subject.count})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Subjek Search Input with Live Dropdown - Multi-select */}
        <div className="flex flex-col gap-1 flex-1 min-w-48 relative" ref={subjekSearchRef}>
          <label className="text-xs font-medium text-slate-500">Cari & Pilih Subjek (Multi)</label>
          <input
            type="text"
            placeholder="Ketik subjek, bisa pilih lebih dari 1..."
            value={subjekSearchInput}
            onChange={(e) => {
              setSubjekSearchInput(e.target.value);
              setSubjekDropdownOpen(e.target.value.length > 0);
            }}
            onFocus={() => subjekSearchInput.length > 0 && setSubjekDropdownOpen(true)}
            className={`${selectClass} cursor-text`}
            disabled={isLoadingAllSubjects}
          />

          {/* Live Search Dropdown - ALL subjects (no restrictions) */}
          {subjekDropdownOpen && filteredSubjects.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredSubjects.map((subject) => {
                const isSelected = selectedSubjeks.includes(subject.value);
                return (
                  <button
                    key={subject.value}
                    onClick={() => handleSubjekSelect(subject.value)}
                    className={`w-full text-left px-3 py-2 text-sm transition flex justify-between items-center ${
                      isSelected
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'text-slate-700 hover:bg-[#6b3a22]/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && <span className="text-green-600">✓</span>}
                      {subject.value === '*others' ? 'Subjek Lainnya' : subject.value}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">({subject.count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {subjekSearchInput && (
            <button
              onClick={() => setSubjekSearchInput("")}
              className="mt-1 text-xs text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active filter pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {selectedCategory && (
          <span className="flex items-center gap-1 rounded-full bg-[#6b3a22]/10 px-3 py-1 text-xs font-medium text-[#6b3a22]">
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
          <span className="flex items-center gap-1 rounded-full bg-[#6b3a22]/10 px-3 py-1 text-xs font-medium text-[#6b3a22]">
            {selectedKetersediaan}
            <button
              onClick={() => onKetersediaanChange("Semua")}
              className="ml-1 leading-none hover:text-[#6b3a22]/70"
            >
              ×
            </button>
          </span>
        )}
        {selectedTahun !== "Semua" && (
          <span className="flex items-center gap-1 rounded-full bg-[#6b3a22]/10 px-3 py-1 text-xs font-medium text-[#6b3a22]">
            {selectedTahun}
            <button
              onClick={() => onTahunChange("Semua")}
              className="ml-1 leading-none hover:text-[#6b3a22]/70"
            >
              ×
            </button>
          </span>
        )}
        {selectedSubjeks.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-[#6b3a22]/10 px-3 py-1 text-xs font-medium text-[#6b3a22]">
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
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Cari: "{subjekSearchInput}"
            <button
              onClick={() => setSubjekSearchInput("")}
              className="ml-1 leading-none hover:text-blue-600"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* Selected subjek pills */}
      {selectedSubjeks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          {selectedSubjeks.map((subjek) => (
            <span
              key={subjek}
              className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
            >
              {subjek}
              <button
                onClick={() => onSubjekChange(subjek)}
                className="ml-1 leading-none hover:text-green-600"
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
