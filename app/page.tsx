import Link from "next/link";
import MasaAktifCardClient from "./components/MasaAktifCardClient";
import ArticlesSlider from "./components/ArticlesSlider";
import LandingSearchBar from "./components/LandingSearchBar";
import { API_URL } from "./lib/api";

async function getLanding() {
  const res = await fetch(`${API_URL}/landing`, {
    cache: "no-store",
  });
  return res.json();
}

async function getBlogs() {
  const res = await fetch(`${API_URL}/blogs`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

async function getAnnouncements(limit?: number) {
  const url =
    typeof limit === "number"
      ? `${API_URL}/announcements?limit=${limit}`
      : `${API_URL}/announcements`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) return [];
  if (Array.isArray(data)) return data;
  return (data?.data ?? []) as any[];
}

function formatBlogDate(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatAnnouncementDate(raw?: string | null) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function normalizeAnnouncementPriority(value?: string | null) {
  const s = String(value ?? "")
    .trim()
    .toLowerCase();
  if (s === "urgent") return "high";
  if (s === "high" || s === "medium" || s === "low") return s;
  return "unknown";
}

function getAnnouncementDateKey(raw?: string | null) {
  if (!raw) return 0;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 0;
  const key = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(parsed);
  return Number(key.replace(/-/g, ""));
}

function getAnnouncementTimeValue(raw?: string | null) {
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPriorityRank(value?: string | null) {
  const p = normalizeAnnouncementPriority(value);
  if (p === "high") return 3;
  if (p === "medium") return 2;
  if (p === "low") return 1;
  return 0;
}

function normalizeInsights(blogs: any[]) {
  const blogItems = (blogs ?? []).map((item: any) => {
    const dateValue = item?.published_at ?? item?.created_at ?? null;
    const parsed = dateValue ? Date.parse(dateValue) : NaN;
    const sortValue = Number.isFinite(parsed) ? parsed : 0;

    return {
      id: `blog-${item.id}`,
      title: item?.title ?? "Tanpa judul",
      imageUrl: item?.cover_url ?? null,
      meta: formatBlogDate(dateValue),
      href: `/articles/${item.id}`,
      label: item?.category ? String(item.category) : "Blog",
      sortValue,
    };
  });

  return blogItems.sort((a, b) => (b.sortValue ?? 0) - (a.sortValue ?? 0));
}

// const staticImages = [
//   "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b",
//   "https://images.unsplash.com/photo-1601582585289-4c4b2c2c9c63",
//   "https://images.unsplash.com/photo-1523240795612-9a054b0db644",
// ];

export default async function Home() {
  const [data, blogs, announcements] = await Promise.all([
    getLanding(),
    getBlogs(),
    getAnnouncements(),
  ]);
  const insights = normalizeInsights(blogs);
  const sortedAnnouncements = [...announcements].sort((a: any, b: any) => {
    const dateA = a?.published_at ?? a?.created_at ?? null;
    const dateB = b?.published_at ?? b?.created_at ?? null;
    const keyA = getAnnouncementDateKey(dateA);
    const keyB = getAnnouncementDateKey(dateB);
    if (keyB !== keyA) return keyB - keyA;

    const prioA = getPriorityRank(a?.priority);
    const prioB = getPriorityRank(b?.priority);
    if (prioB !== prioA) return prioB - prioA;

    return getAnnouncementTimeValue(dateB) - getAnnouncementTimeValue(dateA);
  });
  const visibleAnnouncements = sortedAnnouncements.slice(0, 3);

  return (
    <main className="bg-[#F5F5F5] font-sans">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#1A0F08] via-[#3B2212] to-[#6B3A22] text-white py-24">
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_top_left,rgba(245,158,11,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#F59E0B]/20 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-80 w-96 rounded-full bg-black/30 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div className="space-y-6 motion-safe:animate-[fade-up_0.8s_ease-out]">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
              E-Library STIK
            </span>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              {data.title}
            </h1>

            <p className="text-[#F8C67A] font-semibold text-lg">
              {data.subtitle}
            </p>

            <p className="text-white/80 leading-relaxed">
              E-Library STIK merupakan platform digital resmi yang menyediakan
              akses ke berbagai koleksi buku, jurnal, dan publikasi ilmiah guna
              mendukung kegiatan akademik, penelitian, dan pengembangan ilmu
              pengetahuan di lingkungan Sekolah Tinggi Ilmu Kepolisian.
            </p>

            <LandingSearchBar />

            <div className="flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Akses 24/7
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Koleksi digital
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Pencarian cepat
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/koleksi"
                className="rounded-xl bg-[#F59E0B] px-6 py-3 font-semibold text-[#2A170C] shadow-[0_20px_40px_-25px_rgba(245,158,11,0.9)] transition hover:bg-[#D97706]"
              >
                Explore Collection →
              </Link>

              <Link
                href="/articles"
                className="rounded-xl border border-white/30 px-6 py-3 transition hover:bg-white/10"
              >
                View Articles
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative motion-safe:animate-[fade-in_1s_ease-out]">
            <div className="absolute -left-6 top-10 hidden w-44 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white/80 shadow-[0_20px_40px_-32px_rgba(0,0,0,0.8)] backdrop-blur sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                Quick Search
              </p>
              <p className="mt-2 font-semibold text-white">
                Temukan referensi dalam hitungan detik.
              </p>
            </div>
            <img
              src={data.image_url}
              alt="E-Library STIK"
              className="rounded-3xl border border-white/10 shadow-2xl"
            />
            <div className="absolute -bottom-6 right-6 hidden rounded-2xl bg-white/95 px-4 py-3 text-[#2A170C] shadow-[0_25px_50px_-30px_rgba(15,23,42,0.9)] sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#B45309]">
                Academic Focus
              </p>
              <p className="mt-1 text-sm font-semibold">
                Sumber belajar resmi kampus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MASA AKTIF */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <MasaAktifCardClient />
        </div>
      </section>

      {/* ================= VISION MISSION (PINDAH KE ATAS) ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16">
          {/* LEFT */}
          <div>
            <h2 className="text-4xl font-bold text-[#1F2937]">
              Vision & Mission
            </h2>
          </div>

          {/* RIGHT */}
          <div>
            {/* VISION */}
            <h3 className="text-[#D97706] font-semibold mb-3">Vision</h3>

            <div className="text-gray-700 space-y-2 mb-8">
              {data.vision
                ?.split(/\d+\.\s/)
                .filter(Boolean)
                .map((v: string, i: number) => (
                  <p key={i}>
                    {i + 1}. {v.trim()}
                  </p>
                ))}
            </div>

            {/* MISSION */}
            <h3 className="text-[#D97706] font-semibold mb-3">Mission</h3>

            <div className="text-gray-700 space-y-2">
              {data.mission
                ?.split(/\d+\.\s/)
                .filter(Boolean)
                .map((m: string, i: number) => (
                  <p key={i}>
                    {i + 1}. {m.trim()}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      <section className="py-20 bg-gradient-to-b from-white to-[#F8F4EF]">
        <div className="max-w-7xl mx-auto px-8">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#8A5A34]">
            Campus Bulletin
          </p>
          <h2 className="text-3xl font-bold mb-12 text-[#1F2937]">
            Latest Announcements
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {visibleAnnouncements.map((item: any) => {
              const dateValue =
                item?.published_at ?? item?.created_at ?? item?.date ?? null;
              const dateLabel = formatAnnouncementDate(dateValue);
              const priority = normalizeAnnouncementPriority(item?.priority);
              const isHighPriority = priority === "high";

              return (
                <Link
                  key={item.id}
                  href={`/announcements/${item.id}`}
                  className="group rounded-2xl border border-[#E8DCCF] bg-white/95 p-6 shadow-[0_14px_30px_-24px_rgba(33,16,8,0.5)] transition duration-300 hover:-translate-y-1 hover:border-[#C9A27D] hover:shadow-[0_24px_45px_-28px_rgba(33,16,8,0.55)]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs text-[#D97706] font-semibold">
                      ANNOUNCEMENT
                    </span>
                    {isHighPriority ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        High Priority
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mb-2 text-lg font-semibold leading-snug text-[#1F2937] transition-colors duration-300 group-hover:text-[#4A2A14]">
                    {item.title}
                  </h3>

                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#4B5563]">
                    {item.content}
                  </p>

                  <p className="text-xs font-medium text-[#7C8796]">
                    {dateLabel ?? "-"}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/announcements"
              className="bg-[#512F16] text-white px-6 py-3 rounded-lg hover:bg-[#2A170C]"
            >
              View All Announcements →
            </Link>
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="relative overflow-hidden bg-[#F6F1EB] py-24">
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#D97706]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-52 w-96 rounded-full bg-[#2A170C]/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#6B3A22]">
                Blog Update
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1F2937]">
                Articles & Insights
              </h2>
              <p className="mt-3 text-sm text-slate-600 max-w-xl">
                Rangkuman artikel terbaru untuk mendukung riset dan
                pembelajaran.
              </p>
            </div>

            <Link
              href="/articles"
              className="inline-flex items-center justify-center rounded-full border border-[#512F16] px-6 py-3 text-sm font-semibold text-[#512F16] hover:bg-[#512F16] hover:text-white transition"
            >
              View All Articles
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/80 backdrop-blur px-6 py-8 shadow-[0_40px_90px_-70px_rgba(30,15,6,0.7)]">
            <ArticlesSlider items={insights} />
          </div>
        </div>
      </section>
    </main>
  );
}
