import Link from "next/link";
import MasaAktifCardClient from "./components/MasaAktifCardClient";
import ArticlesSlider from "./components/ArticlesSlider";
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

async function getAnnouncements() {
  const res = await fetch(`${API_URL}/announcements`, {
    cache: "no-store",
  });
  return res.json();
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

  return (
    <main className="bg-[#F5F5F5]">
      {/* HERO */}
      <section className="bg-gradient-to-r from-[#2A170C] to-[#512F16] text-white py-28">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <h1 className="text-6xl font-extrabold mb-4">{data.title}</h1>

            <p className="text-[#F59E0B] font-semibold mb-4 text-lg">
              {data.subtitle}
            </p>

            <p className="text-gray-200 leading-relaxed mb-8">
              E-Library STIK merupakan platform digital resmi yang menyediakan
              akses ke berbagai koleksi buku, jurnal, dan publikasi ilmiah guna
              mendukung kegiatan akademik, penelitian, dan pengembangan ilmu
              pengetahuan di lingkungan Sekolah Tinggi Ilmu Kepolisian.
            </p>

            <div className="flex gap-4">
              <Link
                href="/koleksi"
                className="bg-[#D97706] hover:bg-[#B45309] px-6 py-3 rounded-lg font-semibold shadow-lg"
              >
                Explore Collection →
              </Link>

              <Link
                href="/articles"
                className="border border-white/30 px-6 py-3 rounded-lg hover:bg-white/10 transition"
              >
                View Articles
              </Link>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <img
              src={data.image_url}
              className="rounded-2xl shadow-2xl border border-white/10"
            />
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-bold mb-12 text-[#1F2937]">
            Latest Announcements
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {announcements.map((item: any) => (
              <Link
                key={item.id}
                href={`/announcements/${item.id}`}
                className="group bg-white border rounded-xl p-6 shadow-sm hover:shadow-xl transition"
              >
                <div className="mb-3 text-xs text-[#D97706] font-semibold">
                  ANNOUNCEMENT
                </div>

                <h3 className="font-semibold text-lg mb-2 group-hover:text-[#512F16] transition">
                  {item.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.content}
                </p>

                <p className="text-xs text-gray-400">{item.date}</p>
              </Link>
            ))}
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
