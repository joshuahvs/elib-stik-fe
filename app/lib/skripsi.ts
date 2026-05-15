import { API_URL } from "@/app/lib/api";

export const SKRIPSI_MAX_FILE_BYTES = 15 * 1024 * 1024;

export function normalizeSkripsiStatus(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

export function isSkripsiCancelledStatus(status: unknown): boolean {
  const s = normalizeSkripsiStatus(status);
  return s === "DIBATALKAN" || s === "CANCELLED" || s === "CANCELED";
}

export type SkripsiUser = {
  nama_lengkap?: string | null;
  nim?: string | null;
  username?: string | null;
};

export type SkripsiRow = {
  id: string;
  user_id?: string;
  judul?: string;
  tahun?: number;
  abstrak?: string;
  pembimbing?: string | null;
  penguji?: string | null;
  penulis_tambahan?: string[] | null;
  file_ttd_url?: string | null;
  status?: string;
  alasan_ditolak?: string | null;
  file_name?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string | null;
  reviewed_at?: string | null;
  users?: SkripsiUser | null;
  user?: SkripsiUser | null;
};

export type SkripsiUploadEligibility = {
  allowed: boolean;
  blockingStatus?: string;
};

export function getSkripsiUploadEligibility(
  items: SkripsiRow[],
): SkripsiUploadEligibility {
  for (const row of items ?? []) {
    if (!isSkripsiCancelledStatus(row?.status)) {
      const blockingStatus = normalizeSkripsiStatus(row?.status) || "UNKNOWN";
      return { allowed: false, blockingStatus };
    }
  }
  return { allowed: true };
}

export type ListSkripsiMeResult<T = SkripsiRow> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function pickArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  const candidates = [data?.items, data?.data, data?.rows, data?.results];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

function pickNumber(data: any, keys: string[], fallback: number): number {
  for (const k of keys) {
    const v = data?.[k];
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function buildListResult<T>(data: any, page: number, limit: number): ListSkripsiMeResult<T> {
  const items = pickArray(data);
  const meta = (data as any)?.meta ?? (data as any)?.pagination ?? {};

  const total = pickNumber(
    data,
    ["total", "totalItems", "count"],
    pickNumber(meta, ["total", "totalItems", "count"], items.length),
  );
  const totalPages = pickNumber(
    meta,
    ["totalPages", "total_pages"],
    Math.max(Math.ceil((total || 0) / limit), 1),
  );
  const outPage = pickNumber(data, ["page"], pickNumber(meta, ["page"], page));
  const outLimit = pickNumber(
    data,
    ["limit", "take", "pageSize"],
    pickNumber(meta, ["limit", "take", "pageSize"], limit),
  );

  return {
    items: (items ?? []) as T[],
    page: Math.max(1, Math.trunc(outPage || page)),
    limit: Math.max(1, Math.trunc(outLimit || limit)),
    total: Math.max(0, Math.trunc(total || 0)),
    totalPages: Math.max(1, Math.trunc(totalPages || 1)),
  };
}

async function parseJsonOrText(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  const textBody = !isJson ? await res.text().catch(() => "") : "";
  return { data, textBody };
}

function pickErrorMessage(data: any, textBody: string, fallback: string) {
  const msgFromJson = data?.message ?? data?.error ?? data?.detail;
  const msgFromText = textBody?.trim();
  if (typeof msgFromJson === "string" && msgFromJson.trim()) return msgFromJson.trim();
  if (msgFromText) return msgFromText;
  return fallback;
}

export async function uploadSkripsi(opts: {
  token: string;
  judul: string;
  tahun: string;
  abstrak: string;
  pembimbing?: string;
  penguji?: string;
  penulis_tambahan?: Array<{ nim: string; nama: string }>;
  file: File;
  file_ttd: File;
}): Promise<SkripsiRow> {
  if (opts.file.size > SKRIPSI_MAX_FILE_BYTES) {
    throw new Error("Ukuran file maksimal 15MB");
  }
  if (opts.file_ttd.size > SKRIPSI_MAX_FILE_BYTES) {
    throw new Error("Ukuran file TTD maksimal 15MB");
  }

  const formData = new FormData();
  formData.append("judul", opts.judul);
  formData.append("tahun", opts.tahun);
  formData.append("abstrak", opts.abstrak);
  if (opts.pembimbing?.trim()) {
    formData.append("pembimbing", opts.pembimbing.trim());
  }
  if (opts.penguji?.trim()) {
    formData.append("penguji", opts.penguji.trim());
  }
  for (const penulis of opts.penulis_tambahan ?? []) {
    const nim = String(penulis?.nim ?? "").trim();
    const nama = String(penulis?.nama ?? "").trim();
    if (nim && nama) {
      formData.append("penulis_tambahan", JSON.stringify({ nim, nama }));
    }
  }
  formData.append("file_skripsi", opts.file);
  formData.append("file_ttd", opts.file_ttd);

  const res = await fetch(`${API_URL}/skripsi`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengunggah skripsi");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  const row = (data as any)?.data ?? data;
  return row as SkripsiRow;
}

export async function fetchSkripsiMe(opts: {
  token: string;
  page?: number;
  limit?: number;
}): Promise<ListSkripsiMeResult> {
  const page = Math.max(1, Math.trunc(opts.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(opts.limit ?? 10)));

  const url = new URL(`${API_URL}/skripsi/me`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil daftar skripsi");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return buildListResult<SkripsiRow>(data, page, limit);
}

export async function cancelSkripsi(opts: {
  token: string;
  id: string;
}): Promise<SkripsiRow> {
  const res = await fetch(
    `${API_URL}/skripsi/${encodeURIComponent(opts.id)}/batalkan`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal membatalkan pengajuan");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  const row = (data as any)?.data ?? data;
  return row as SkripsiRow;
}

export type SkripsiSignedUrlResult = {
  signedUrl: string;
  expiresIn?: number;
  bucket?: string;
  path?: string;
};

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export async function fetchSkripsiSignedUrl(opts: {
  token: string;
  id: string;
}): Promise<SkripsiSignedUrlResult> {
  const res = await fetch(
    `${API_URL}/skripsi/${encodeURIComponent(opts.id)}/file`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil link PDF");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  const signedUrl =
    pickFirstString(data, ["signedUrl", "signed_url", "url"]) ?? "";

  if (!signedUrl) {
    throw new Error("Response tidak memiliki signedUrl");
  }

  return {
    signedUrl,
    expiresIn: (data as any)?.expiresIn,
    bucket: (data as any)?.bucket,
    path: (data as any)?.path,
  };
}

export async function fetchSkripsiTtdSignedUrl(opts: {
  token: string;
  id: string;
}): Promise<SkripsiSignedUrlResult> {
  const res = await fetch(
    `${API_URL}/skripsi/${encodeURIComponent(opts.id)}/file-ttd`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil link TTD");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  const signedUrl =
    pickFirstString(data, ["signedUrl", "signed_url", "url"]) ?? "";

  if (!signedUrl) {
    throw new Error("Response tidak memiliki signedUrl");
  }

  return {
    signedUrl,
    expiresIn: (data as any)?.expiresIn,
    bucket: (data as any)?.bucket,
    path: (data as any)?.path,
  };
}

export async function fetchSkripsiAdminList(opts: {
  token: string;
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}): Promise<ListSkripsiMeResult<SkripsiRow>> {
  const page = Math.max(1, Math.trunc(opts.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(opts.limit ?? 10)));

  const url = new URL(`${API_URL}/skripsi/admin`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (opts.status) url.searchParams.set("status", opts.status);
  if (opts.q) url.searchParams.set("q", opts.q);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil daftar skripsi");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return buildListResult<SkripsiRow>(data, page, limit);
}

export async function fetchSkripsiAdminDetail(opts: {
  token: string;
  id: string;
}): Promise<SkripsiRow> {
  const res = await fetch(
    `${API_URL}/skripsi/admin/${encodeURIComponent(opts.id)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil detail skripsi");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return ((data as any)?.data ?? data) as SkripsiRow;
}

export async function updateSkripsiStatus(opts: {
  token: string;
  id: string;
  status: "DISETUJUI" | "DITOLAK" | string;
  alasan_ditolak?: string;
}): Promise<SkripsiRow> {
  const res = await fetch(
    `${API_URL}/skripsi/${encodeURIComponent(opts.id)}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: opts.status,
        alasan_ditolak: opts.alasan_ditolak,
      }),
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal memperbarui status skripsi");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return ((data as any)?.data ?? data) as SkripsiRow;
}

export async function fetchSkripsiRepositoryList(opts: {
  token: string;
  page?: number;
  limit?: number;
  q?: string;
  tahun?: string;
}): Promise<ListSkripsiMeResult<SkripsiRow>> {
  const page = Math.max(1, Math.trunc(opts.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(opts.limit ?? 10)));

  const url = new URL(`${API_URL}/skripsi/repository`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (opts.q) url.searchParams.set("q", opts.q);
  if (opts.tahun) url.searchParams.set("tahun", opts.tahun);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil daftar skripsi");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return buildListResult<SkripsiRow>(data, page, limit);
}

export async function fetchSkripsiRepositoryDetail(opts: {
  token: string;
  id: string;
}): Promise<SkripsiRow> {
  const res = await fetch(
    `${API_URL}/skripsi/repository/${encodeURIComponent(opts.id)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil detail skripsi");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return ((data as any)?.data ?? data) as SkripsiRow;
}

export async function fetchSkripsiRepositorySignedUrl(opts: {
  token: string;
  id: string;
}): Promise<SkripsiSignedUrlResult> {
  const res = await fetch(
    `${API_URL}/skripsi/repository/${encodeURIComponent(opts.id)}/file`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal mengambil link PDF");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  const signedUrl =
    pickFirstString(data, ["signedUrl", "signed_url", "url"]) ?? "";

  if (!signedUrl) {
    throw new Error("Response tidak memiliki signedUrl");
  }

  return {
    signedUrl,
    expiresIn: (data as any)?.expiresIn,
    bucket: (data as any)?.bucket,
    path: (data as any)?.path,
  };
}