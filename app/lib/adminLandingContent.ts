import { API_URL } from "@/app/lib/api";

export type LandingContent = {
  title?: string | null;
  subtitle?: string | null;
  vision?: string | null;
  mission?: string | null;
  image_url?: string | null;
};

export async function fetchAdminLandingContent(opts: { token: string }) {
  const res = await fetch(`${API_URL}/admin/landing/content`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? "Gagal mengambil konten landing";
    throw new Error(msg);
  }

  return data as LandingContent;
}

export async function updateAdminLandingContent(opts: {
  token: string;
  payload: LandingContent;
}) {
  const res = await fetch(`${API_URL}/admin/landing/content`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(opts.payload ?? {}),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? "Gagal menyimpan konten landing";
    throw new Error(msg);
  }

  return data as LandingContent;
}
