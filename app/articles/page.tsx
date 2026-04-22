import Link from "next/link";
import { API_URL } from "@/app/lib/api";

async function getArticles() {
  const res = await fetch(`${API_URL}/articles`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <main className="min-h-screen bg-[#F3F4F6] py-16 px-6">

      {/* HERO */}
      <div className="relative bg-gradient-to-r from-[#2A170C] via-[#512F16] to-[#7A4A2A] text-white py-20 px-6 rounded-2xl mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6"
          >
            ← Kembali ke Beranda
          </Link>

          <h1 className="text-4xl font-bold mb-3">
            Articles & Insights
          </h1>

          <p className="text-white/80 max-w-xl">
            Kumpulan artikel ilmiah dan insight terbaru dari perpustakaan digital.
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="max-w-6xl mx-auto">

        {articles.length === 0 ? (
          <div className="text-center text-gray-500">
            Tidak ada artikel
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {articles.map((item: any) => (
              <Link key={item.id} href={`/articles/${item.id}`}>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer">

                  {item.url_sampul && (
                    <img
                      src={item.url_sampul}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  <div className="p-5">

                    <h2 className="text-lg font-semibold text-[#1F2937] mb-2 line-clamp-2">
                      {item.judul}
                    </h2>

                    <p className="text-sm text-gray-500">
                      {item.tahun_terbit || "-"}
                    </p>

                  </div>
                </div>
              </Link>
            ))}

          </div>
        )}

      </div>

    </main>
  );
}