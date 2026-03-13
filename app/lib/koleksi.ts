import { API_URL } from "./api";

export interface BukuRow {
  id: number;
  jenis_koleksi: string | null;
  url_sumber: string | null;
  judul: string | null;
  url_sampul: string | null;
  file_path?: string | null;
  filePath?: string | null;
  no_panggil: string | null;
  nama_orang: string | null;
  subjek: string | null;
  bahasa: string | null;
  isbn: string | null;
  edisi: string | null;
  sumber: string | null;
  lembaga_pemilik: string | null;
  lokasi: string | null;
  nama_badan: string | null;
  nama_orang_tambahan: string | null;
  tempat_terbit: string | null;
  penerbit: string | null;
  tahun_terbit: number | null;
  // Fields from specific collection tables
  file_path?: string | null;
  deskripsi_fisik?: string | null;
  volume?: string | null;
  catatan_umum?: string | null;
  sumber_data?: string | null;
  sumber_koleksi?: string | null;
  issn_or_isbn?: string | null;
  issn?: string | null;
  abstrak?: string | null;
  kata_kunci?: string | null;
  kode_bahasa?: string | null;
  frekuensi_terbit?: string | null;
  penerbitan?: string | null;
  angkatan?: number | null;
  turnitin_persen?: number | null;
  barcode?: string | null;
  [key: string]: unknown;
}

export interface KoleksiResponse {
  data: BukuRow[];
  meta: {
    total_data: number;
    current_page: number;
    total_pages: number;
    per_page: number;
  };
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      qs.set(key, String(value));
    }
  }
  return qs.toString();
}

export async function fetchKoleksi(opts: {
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<KoleksiResponse> {
  const query = buildQuery({
    q: opts.keyword,
    page: opts.page,
    limit: opts.limit,
  });

  const res = await fetch(`${API_URL}/koleksi/search?${query}`);

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchBukuById(id: string): Promise<BukuRow | null> {
  const res = await fetch(`${API_URL}/koleksi/${encodeURIComponent(id)}`);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  const json = await res.json();
  return json.data ?? null;
}
