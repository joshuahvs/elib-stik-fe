import { API_URL } from "./api";

export interface BukuRow {
  id: number;
  jenis_koleksi: string | null;
  url_sumber: string | null;
  judul: string | null;
  url_sampul: string | null;
  file_path?: string | null;
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
  deskripsi_fisik?: string | null;
  volume?: string | null;
  catatan_umum?: string | null;
  sumber_data?: string | null;
  sumber_koleksi?: string | null;
  issn_or_isbn?: string | null;
  issn?: string | null;
  abstrak?: string | null;
  sinopsis?: string | null;
  jumlah_eksemplar?: number | null;
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
  category?: string;
  tahun?: string | number | (string | number)[];
  subjek?: string | string[];
  ketersediaan?: string;
}): Promise<KoleksiResponse> {
  const qs = new URLSearchParams();
  
  if (opts.keyword) qs.set('q', opts.keyword);
  if (opts.page) qs.set('page', String(opts.page));
  if (opts.limit) qs.set('limit', String(opts.limit));
  if (opts.category) qs.set('category', opts.category);
  if (opts.ketersediaan) qs.set('ketersediaan', opts.ketersediaan);
  
  // Handle multiple tahun values
  if (opts.tahun) {
    const tahunArray = Array.isArray(opts.tahun) ? opts.tahun : [opts.tahun];
    tahunArray.forEach((t) => qs.append('tahun', String(t)));
  }
  
  // Handle multiple subjek values
  if (opts.subjek) {
    const subjekArray = Array.isArray(opts.subjek) ? opts.subjek : [opts.subjek];
    subjekArray.forEach((s) => qs.append('subjek', s));
  }

  const res = await fetch(`${API_URL}/koleksi/search?${qs.toString()}`);

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

export async function fetchKoleksiCategories(): Promise<{ data: string[] }> {
  const res = await fetch(`${API_URL}/koleksi/categories`);

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchKoleksiYears(): Promise<{ data: number[] }> {
  const res = await fetch(`${API_URL}/koleksi/years`);

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchKoleksiSubjects(): Promise<{ data: Record<string, any[]> }> {
  const res = await fetch(`${API_URL}/koleksi/subjects`);

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchKoleksiSubjectsAll(): Promise<{ data: any[] }> {
  const res = await fetch(`${API_URL}/koleksi/subjects-all`);

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  return res.json();
}

