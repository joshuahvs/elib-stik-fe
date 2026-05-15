import { API_URL } from "@/app/lib/api";

export type AnnouncementPriority = "low" | "medium" | "high" | "urgent" | string;

export type AdminAnnouncement = {
  id: string;
  title?: string | null;
  content?: string | null;
  date?: string | null;
  priority?: AnnouncementPriority | null;
  published_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function extractErrorMessage(data: any, fallback: string) {
  return (
    pickFirstString(data, ["message", "error", "detail"]) ??
    pickFirstString(data?.data, ["message", "error", "detail"]) ??
    fallback
  );
}

export async function fetchAdminAnnouncements(opts: { token: string }) {
  const res = await fetch(`${API_URL}/admin/announcements`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal mengambil data pengumuman");
    throw new Error(msg);
  }

  if (Array.isArray(data)) return data as AdminAnnouncement[];
  return (data?.data ?? data ?? []) as AdminAnnouncement[];
}

export async function createAdminAnnouncement(opts: {
  token: string;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  expires_at?: string | null;
  is_active?: boolean;
  published_at?: string | null;
}) {
  const payload: Record<string, any> = {
    title: opts.title.trim(),
    content: opts.content.trim(),
  };

  if (opts.priority) payload.priority = String(opts.priority);
  if (opts.expires_at !== undefined) payload.expires_at = opts.expires_at;
  if (opts.is_active !== undefined) payload.is_active = opts.is_active;
  if (opts.published_at !== undefined) payload.published_at = opts.published_at;

  const res = await fetch(`${API_URL}/admin/announcements`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal menambahkan pengumuman");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data as { message?: string; data?: AdminAnnouncement };
}

export async function updateAdminAnnouncement(opts: {
  token: string;
  id: string;
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  expires_at?: string | null;
  is_active?: boolean;
  published_at?: string | null;
}) {
  const payload: Record<string, any> = {};

  if (opts.title !== undefined) payload.title = opts.title.trim();
  if (opts.content !== undefined) payload.content = opts.content.trim();
  if (opts.priority !== undefined) payload.priority = String(opts.priority);
  if (opts.expires_at !== undefined) payload.expires_at = opts.expires_at;
  if (opts.is_active !== undefined) payload.is_active = opts.is_active;
  if (opts.published_at !== undefined) payload.published_at = opts.published_at;

  const res = await fetch(
    `${API_URL}/admin/announcements/${encodeURIComponent(opts.id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal memperbarui pengumuman");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data as { message?: string; data?: AdminAnnouncement };
}

export async function deleteAdminAnnouncement(opts: {
  token: string;
  id: string;
}) {
  const res = await fetch(
    `${API_URL}/admin/announcements/${encodeURIComponent(opts.id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal menghapus pengumuman");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data as { message?: string };
}
