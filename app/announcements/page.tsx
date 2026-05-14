import Link from "next/link";
import { API_URL } from "@/app/lib/api";

async function getAnnouncements() {
  const res = await fetch(`${API_URL}/announcements`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

function formatAnnouncementDate(raw?: string | null) {
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <main className="min-h-screen bg-[#F3F4F6] py-16 px-6">
      {/* HERO HEADER */}
      <div className="relative bg-gradient-to-r from-[#2A170C] via-[#512F16] to-[#7A4A2A] text-white py-20 px-6 rounded-2xl mb-12 overflow-hidden">
        {/* overlay */}
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative max-w-6xl mx-auto">
          {/* BACK BUTTON */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6 transition"
          >
            ← Kembali ke Beranda
          </Link>

          {/* TITLE */}
          <h1 className="text-4xl font-bold mb-3">Pengumuman</h1>

          {/* SUBTITLE */}
          <p className="text-white/80 max-w-xl">
            Informasi terbaru terkait kegiatan, pembaruan layanan, dan
            pengumuman resmi perpustakaan.
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="max-w-6xl mx-auto">
        {announcements.length === 0 ? (
          <div className="text-center text-gray-500">Tidak ada pengumuman</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((item: any) => {
              const dateValue =
                item?.published_at ?? item?.created_at ?? item?.date ?? null;
              const dateLabel = formatAnnouncementDate(dateValue);

              return (
                <Link key={item.id} href={`/announcements/${item.id}`}>
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 cursor-pointer relative overflow-hidden">
                    {/* accent kiri */}
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#512F16]"></div>

                    <div className="pl-3">
                      {/* TOP */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs bg-[#512F16]/10 text-[#512F16] px-3 py-1 rounded-full">
                          Pengumuman
                        </span>

                        <span className="text-xs text-gray-400">
                          {dateLabel}
                        </span>
                      </div>

                      {/* TITLE */}
                      <h2 className="text-lg font-semibold text-[#1F2937] mb-2 line-clamp-2">
                        {item.title}
                      </h2>

                      {/* CONTENT */}
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {item.content || "-"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
