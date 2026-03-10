import { API_URL } from "@/app/lib/api";

export type MeResponse = {
  id: string;
  email: string | null;
  role: string | null;
  username?: string | null;
  nama_lengkap?: string | null;
  status?: string | null;
  jenjang?: string | null;
  tanggal_batas_aktif?: string | null;
  last_login_at?: string | null;
};

export async function fetchMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "Gagal mengambil data user");
  }

  return data;
}