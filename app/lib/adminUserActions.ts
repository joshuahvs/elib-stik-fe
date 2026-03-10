import { API_URL } from "@/app/lib/api";

export async function updateAdminUserStatus(opts: {
  token: string;
  userId: string;
  status: "Aktif" | "Nonaktif" | "Deleted";
}) {
  const res = await fetch(`${API_URL}/admin/users/${opts.userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.token}`,
    },
    body: JSON.stringify({
      status: opts.status,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "Gagal mengubah status user");
  }

  return data;
}

export async function extendAdminUserMasaAktif(opts: {
  token: string;
  userId: string;
  years: number;
}) {
  const res = await fetch(`${API_URL}/admin/users/${opts.userId}/extend-masa-aktif`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.token}`,
    },
    body: JSON.stringify({
      years: opts.years,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? "Gagal memperpanjang masa aktif");
  }

  return data;
}