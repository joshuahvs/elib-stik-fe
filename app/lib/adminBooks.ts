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