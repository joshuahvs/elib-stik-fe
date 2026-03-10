import { API_URL } from "@/app/lib/api";

export type UserStatus = "Aktif" | "Nonaktif" | "Deleted" | string;
export type UserRole = "mahasiswa" | "dosen" | "umum" | "admin" | string;

export type AdminUserRow = {
  id: string;
  email: string | null;
  role: string | null;
  status: UserStatus | null;
  last_login_at: string | null;
  jenjang?: string | null;
  tanggal_batas_aktif?: string | null;
  nama_lengkap?: string | null;
  username?: string | null;
  nim?: string | null;
  nomor_dosen?: string | null;
  created_at?: string | null;
};

export type AdminUsersResponse =
  | { data: AdminUserRow[]; total?: number; page?: number; limit?: number }
  | AdminUserRow[];

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminUsers(opts: {
  token: string;
  status?: UserStatus | "";
  role?: UserRole | "";
  email?: string;
  page?: number;
  limit?: number;
}) {
    const qs = buildQuery({
    status: opts.status,
    role: opts.role,
    email: opts.email,
    page: opts.page ?? 1,
    limit: opts.limit ?? 10,
  });

  const res = await fetch(`${API_URL}/admin/users${qs}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${opts.token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? "Gagal mengambil data users";
    throw new Error(msg);
  }

  if (Array.isArray(data)) return { data };
  return data as { data: AdminUserRow[]; total?: number; page?: number; limit?: number };
}