import { API_URL } from "@/app/lib/api";

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export const ADMIN_BOOK_MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function createAdminBook(opts: {
  token: string;
  judul: string;
  nama_orang: string;
  penerbit?: string;
  tahun_terbit?: string;
  subjek?: string;
  lokasi?: string;
  sinopsis?: string;
  jumlah_eksemplar?: string;
  url_sampul?: string;
  file: File;
}) {
  if (!opts.file) throw new Error("File buku wajib diunggah");
  if (opts.file.size > ADMIN_BOOK_MAX_FILE_BYTES) {
    throw new Error("Ukuran file maksimal 20MB");
  }

  const formData = new FormData();
  formData.append("judul", opts.judul);
  formData.append("nama_orang", opts.nama_orang);

  if (opts.penerbit?.trim()) formData.append("penerbit", opts.penerbit.trim());
  if (opts.tahun_terbit?.trim())
    formData.append("tahun_terbit", opts.tahun_terbit.trim());
  if (opts.subjek?.trim()) formData.append("subjek", opts.subjek.trim());
  if (opts.lokasi?.trim()) formData.append("lokasi", opts.lokasi.trim());
  if (opts.sinopsis?.trim()) formData.append("sinopsis", opts.sinopsis.trim());
  if (opts.jumlah_eksemplar?.trim()) {
    formData.append("jumlah_eksemplar", opts.jumlah_eksemplar.trim());
  }
  if (opts.url_sampul?.trim())
    formData.append("url_sampul", opts.url_sampul.trim());

  formData.append("file_buku", opts.file);

  const res = await fetch(`${API_URL}/admin/books`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      pickFirstString(data, ["message", "error", "detail"]) ??
      "Gagal menambahkan buku";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export async function updateAdminBook(opts: {
  token: string;
  id: string | number;
  judul: string;
  nama_orang: string;
  penerbit: string;
  tahun_terbit: string;
  subjek: string;
  lokasi: string;
  sinopsis: string;
  jumlah_eksemplar: string;
  url_sampul?: string | null;
  isbn?: string;
  bahasa?: string;
}) {
  const res = await fetch(`${API_URL}/admin/books/${encodeURIComponent(String(opts.id))}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      judul: opts.judul,
      nama_orang: opts.nama_orang,
      penerbit: opts.penerbit,
      tahun_terbit: opts.tahun_terbit,
      subjek: opts.subjek,
      lokasi: opts.lokasi,
      sinopsis: opts.sinopsis,
      jumlah_eksemplar: opts.jumlah_eksemplar,
      url_sampul: opts.url_sampul ?? null,
      isbn: opts.isbn,
      bahasa: opts.bahasa,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      pickFirstString(data, ["message", "error", "detail"]) ??
      "Gagal memperbarui buku";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export async function archiveAdminBook(opts: {
  token: string;
  id: string | number;
}) {
  const res = await fetch(
    `${API_URL}/admin/books/${encodeURIComponent(String(opts.id))}`,
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
    const msg =
      pickFirstString(data, ["message", "error", "detail"]) ??
      "Gagal menghapus buku";

    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export type ArchivedBookRow = {
  id: number | string;
  judul: string | null;
  nama_orang: string | null;
  subjek: string | null;
  tahun_terbit: number | null;
  archived_at: string | null;
  url_sampul?: string | null;
  penerbit?: string | null;
  lokasi?: string | null;
  jumlah_eksemplar?: number | null;
};

export type ArchivedBooksResponse = {
  data: ArchivedBookRow[];
  categories?: string[];
  meta: {
    total_data: number;
    current_page: number;
    total_pages: number;
    per_page: number;
  };
};

export async function fetchArchivedBooks(opts: {
  token: string;
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  from?: string;
  to?: string;
}): Promise<ArchivedBooksResponse> {
  const qs = new URLSearchParams();

  if (opts.page) qs.set("page", String(opts.page));
  if (opts.limit) qs.set("limit", String(opts.limit));
  if (opts.q?.trim()) qs.set("q", opts.q.trim());
  if (opts.category?.trim()) qs.set("category", opts.category.trim());
  if (opts.from?.trim()) qs.set("from", opts.from.trim());
  if (opts.to?.trim()) qs.set("to", opts.to.trim());

  const res = await fetch(`${API_URL}/admin/books/archive?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      pickFirstString(data, ["message", "error", "detail"]) ??
      "Gagal mengambil data arsip buku";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export async function retrieveArchivedBook(opts: {
  token: string;
  id: string | number;
}) {
  const res = await fetch(
    `${API_URL}/admin/books/${encodeURIComponent(String(opts.id))}/retrieve`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      pickFirstString(data, ["message", "error", "detail"]) ??
      "Gagal mengembalikan buku";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}