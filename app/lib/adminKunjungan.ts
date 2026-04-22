import { API_URL } from "@/app/lib/api";
import { getErrorMessage } from "@/app/components/ErrorMessage";

export type KunjunganRow = {
  id: number;
  user_id: string;
  nama: string;
  email: string;
  role: string;
  tanggal_kunjungan: string;
  checkin_date: string;
  created_at: string;
};

export type KunjunganResponse = {
  data: KunjunganRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchAdminKunjungan(params: {
  token: string;
  start_date?: string;
  end_date?: string;
  role?: string;
  query?: string;
  page?: number;
  limit?: number;
}): Promise<KunjunganResponse> {
  const search = new URLSearchParams();

  if (params.start_date?.trim()) search.set("start_date", params.start_date.trim());
  if (params.end_date?.trim()) search.set("end_date", params.end_date.trim());
  if (params.role?.trim()) search.set("role", params.role.trim());
  if (params.query?.trim()) search.set("query", params.query.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const url = `${API_URL}/api/kunjungan${search.toString() ? `?${search.toString()}` : ""}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(getErrorMessage(data, "Gagal memuat riwayat kunjungan."));
  }

  return data;
}