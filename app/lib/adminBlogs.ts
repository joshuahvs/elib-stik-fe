import { API_URL } from "@/app/lib/api";

export type BlogStatus = "draft" | "published" | string;

export type AdminBlog = {
  id: string;
  title?: string | null;
  author?: string | null;
  category?: string | null;
  excerpt?: string | null;
  content?: string | null;
  cover_url?: string | null;
  cover_path?: string | null;
  status?: BlogStatus | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
};

export const ADMIN_BLOG_MAX_FILE_BYTES = 5 * 1024 * 1024;

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

export function validateCoverImage(file: File | null): string | null {
  if (!file) return null;
  if (file.size <= 0) return "File cover tidak valid";
  if (file.size > ADMIN_BLOG_MAX_FILE_BYTES) return "Ukuran cover maksimal 5MB";

  const name = file.name?.toLowerCase?.() ?? "";
  const type = file.type?.toLowerCase?.() ?? "";
  const isImage =
    type.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp");

  if (!isImage) return "Cover harus berupa gambar";
  return null;
}

export async function fetchAdminBlogs(opts: { token: string }) {
  const res = await fetch(`${API_URL}/admin/blogs`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal mengambil data blog");
    throw new Error(msg);
  }

  if (Array.isArray(data)) return data as AdminBlog[];
  return (data?.data ?? data ?? []) as AdminBlog[];
}

export async function createAdminBlog(opts: {
  token: string;
  title: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
  status?: BlogStatus;
  cover?: File | null;
}) {
  const coverMsg = validateCoverImage(opts.cover ?? null);
  if (coverMsg) throw new Error(coverMsg);

  const formData = new FormData();
  formData.append("title", opts.title.trim());
  formData.append("author", opts.author.trim());
  formData.append("category", opts.category.trim());
  formData.append("excerpt", opts.excerpt.trim());
  formData.append("content", opts.content.trim());

  if (opts.status) formData.append("status", String(opts.status));
  if (opts.cover) formData.append("cover", opts.cover);

  const res = await fetch(`${API_URL}/admin/blogs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal menambahkan blog");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data as { message?: string; data?: AdminBlog };
}

export async function updateAdminBlog(opts: {
  token: string;
  id: string;
  title?: string;
  author?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  status?: BlogStatus;
  cover?: File | null;
}) {
  const coverMsg = validateCoverImage(opts.cover ?? null);
  if (coverMsg) throw new Error(coverMsg);

  const formData = new FormData();
  if (opts.title !== undefined) formData.append("title", opts.title.trim());
  if (opts.author !== undefined) formData.append("author", opts.author.trim());
  if (opts.category !== undefined) formData.append("category", opts.category.trim());
  if (opts.excerpt !== undefined) formData.append("excerpt", opts.excerpt.trim());
  if (opts.content !== undefined) formData.append("content", opts.content.trim());
  if (opts.status !== undefined) formData.append("status", String(opts.status));
  if (opts.cover) formData.append("cover", opts.cover);

  const res = await fetch(`${API_URL}/admin/blogs/${encodeURIComponent(opts.id)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal memperbarui blog");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data as { message?: string; data?: AdminBlog };
}

export async function deleteAdminBlog(opts: { token: string; id: string }) {
  const res = await fetch(`${API_URL}/admin/blogs/${encodeURIComponent(opts.id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = extractErrorMessage(data, "Gagal menghapus blog");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data as { message?: string };
}
