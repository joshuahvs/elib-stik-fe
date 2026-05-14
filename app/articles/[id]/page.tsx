import Link from "next/link";
import { API_URL } from "@/app/lib/api";

type DetailResult =
  | { type: "article"; data: any }
  | { type: "blog"; data: any };

async function getDetail(id: string): Promise<DetailResult | null> {
  const isNumericId = /^\d+$/.test(id);

  if (isNumericId) {
    const res = await fetch(`${API_URL}/articles/${id}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data) return { type: "article", data };
    }
  }

  const blogRes = await fetch(`${API_URL}/blogs/${id}`, {
    cache: "no-store",
  });

  if (!blogRes.ok) return null;
  const blog = await blogRes.json().catch(() => null);
  if (!blog) return null;
  return { type: "blog", data: blog };
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

export default async function ArticleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getDetail(id);

  if (!result) {
    return (
      <div className="p-10 text-center">Artikel atau blog tidak ditemukan</div>
    );
  }

  if (result.type === "blog") {
    const data = result.data;
    const dateText = formatBlogDate(data.published_at ?? data.created_at);

    return (
      <main className="min-h-screen bg-[#0F0B08] text-white">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#120B05] via-[#2A170C] to-[#4A2A14]" />
          <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-[#D97706]/20 blur-3xl" />
          <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-32">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
            >
              Back to Articles
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/70">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 font-semibold text-white/90">
                {data.category ?? "Blog"}
              </span>
              {dateText ? <span>{dateText}</span> : null}
              {data.author ? <span>oleh {data.author}</span> : null}
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-semibold leading-tight">
              {data.title}
            </h1>

            {data.excerpt ? (
              <p className="mt-4 max-w-2xl text-base text-white/70">
                {data.excerpt}
              </p>
            ) : null}
          </div>
        </section>

        <section className="relative -mt-20">
          <div className="max-w-5xl mx-auto px-6 pb-16">
            <div className="rounded-3xl bg-white text-slate-900 shadow-2xl p-6 md:p-10">
              {data.cover_url ? (
                <img
                  src={data.cover_url}
                  className="w-full h-[360px] object-cover rounded-2xl mb-8"
                  alt={data.title ?? "Cover"}
                />
              ) : null}

              {data.content ? (
                <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {data.content}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const data = result.data;

  return (
    <main className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-bold mb-4">{data.judul}</h1>

      <p className="text-gray-400 mb-6">{data.tahun_terbit}</p>

      {data.url_sampul ? (
        <img
          src={data.url_sampul}
          className="w-full h-[400px] object-cover rounded-lg mb-8"
          alt={data.judul ?? "Sampul"}
        />
      ) : null}

      {data.content ? (
        <p className="text-gray-700 whitespace-pre-line">{data.content}</p>
      ) : null}
    </main>
  );
}
