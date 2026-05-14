import { API_URL } from "@/app/lib/api";

async function getAnnouncement(id: string) {
  const res = await fetch(`${API_URL}/announcements/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
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

export default async function AnnouncementDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await getAnnouncement(id);

  if (!data) {
    return (
      <div className="p-20 text-center text-gray-500">
        Pengumuman tidak ditemukan
      </div>
    );
  }

  return (
    <main className="bg-gray-100 min-h-screen py-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-md p-10">
          {/* LABEL */}
          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
            Pengumuman
          </span>

          {/* TITLE */}
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            {data.title}
          </h1>

          {/* DATE */}
          <p className="text-sm text-gray-400 mt-2">
            {formatAnnouncementDate(
              data?.published_at ?? data?.created_at ?? data?.date ?? null,
            )}
          </p>

          {/* DIVIDER */}
          <div className="h-[1px] bg-gray-200 my-6"></div>

          {/* CONTENT (NO DOUBLE) */}
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {data.content}
          </div>
        </div>
      </div>
    </main>
  );
}
