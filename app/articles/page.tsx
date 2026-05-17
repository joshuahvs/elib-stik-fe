import Link from "next/link";
import { API_URL } from "@/app/lib/api";

async function getBlogs() {
  const res = await fetch(`${API_URL}/blogs`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
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

function normalizeBlogs(blogs: any[]) {
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
      excerpt: item?.excerpt ?? null,
      sortValue,
    };
  });

  return blogItems.sort((a, b) => (b.sortValue ?? 0) - (a.sortValue ?? 0));
}

export default async function ArticlesPage() {
  const blogs = await getBlogs();
  const insights = normalizeBlogs(blogs);

  return (
    <main className="min-h-screen bg-[#F6F3EF] text-slate-900">
      <section className="relative overflow-hidden px-6 pt-16 pb-10">
        <div className="absolute -top-32 right-10 h-72 w-72 rounded-full bg-[#D97706]/20 blur-3xl" />
        <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-[#6B3A22]/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto rounded-[28px] border border-white/60 bg-gradient-to-br from-[#24140A] via-[#4B2A14] to-[#6B3A1C] text-white px-8 py-14 shadow-[0_35px_80px_-60px_rgba(15,7,2,0.8)]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            ← Kembali ke Beranda
          </Link>

          <p className="mt-6 text-xs uppercase tracking-[0.4em] text-white/60">
            Blog
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-semibold">
            Articles & Insights
          </h1>
          <p className="mt-4 text-white/75 max-w-2xl">
            Kumpulan tulisan terbaru dari E-Library STIK untuk mendukung
            kegiatan akademik dan inspirasi belajar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/70">
            <span className="rounded-full border border-white/30 px-3 py-1">
              Konten terbaru
            </span>
            <span className="rounded-full border border-white/30 px-3 py-1">
              Update perpustakaan
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Blog Terbaru
            </h2>
            <p className="text-sm text-slate-500">
              Temukan tulisan terbaru yang sudah dipublikasikan.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Total {insights.length} blog
          </div>
        </div>

        {insights.length === 0 ? (
          <div className="text-center text-gray-500">Tidak ada blog</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((item) => (
              <Link key={item.id} href={item.href}>
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-35px_rgba(15,7,2,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_80px_-45px_rgba(15,7,2,0.7)]">
                  <div className="relative h-52 w-full overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-slate-200 via-slate-100 to-white" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute left-4 right-4 bottom-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-white/90 px-3 py-1 font-semibold text-[#2A170C]">
                        {item.label}
                      </span>
                      {item.meta ? (
                        <span className="rounded-full bg-black/40 px-3 py-1 text-white/80">
                          {item.meta}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-[#1F2937] mb-2 line-clamp-2 group-hover:text-[#6B3A22] transition">
                      {item.title}
                    </h2>

                    {item.excerpt ? (
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {item.excerpt}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
