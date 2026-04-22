import { API_URL } from "@/app/lib/api";

async function getArticle(id: string) {
  const res = await fetch(`${API_URL}/articles/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function ArticleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await getArticle(id);

  if (!data) {
    return <div className="p-10 text-center">Artikel tidak ditemukan</div>;
  }

  return (
    <main className="max-w-4xl mx-auto py-20 px-6">

      {/* TITLE */}
      <h1 className="text-4xl font-bold mb-4">
        {data.judul}
      </h1>

      {/* DATE */}
      <p className="text-gray-400 mb-6">
        {data.tahun_terbit}
      </p>

      {/* IMAGE */}
      {data.url_sampul && (
        <img
          src={data.url_sampul}
          className="w-full h-[400px] object-cover rounded-lg mb-8"
        />
      )}

      {/* CONTENT */}
    {data.content && (
    <p className="text-gray-700 whitespace-pre-line">
        {data.content}
    </p>
    )}

    </main>
  );
}

