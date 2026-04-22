import { API_URL } from "@/app/lib/api";

export type AjukanPeminjamanResponse = any;

export type ListRiwayatMeResult<T = any> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type ListAdminPeminjamanResult<T = any> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
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

export async function fetchRiwayatPeminjamanMe(opts: {
  token: string;
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ListRiwayatMeResult> {
  const page = Math.max(1, Math.trunc(opts.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(opts.limit ?? 10)));

  const url = new URL(`${API_URL}/peminjaman-buku/me/riwayat`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  
  if (opts.status) url.searchParams.set("status", opts.status);
  if (opts.sortBy) url.searchParams.set("sortBy", opts.sortBy);
  if (opts.sortOrder) url.searchParams.set("sortOrder", opts.sortOrder);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  const textBody = !isJson ? await res.text().catch(() => "") : "";

  if (!res.ok) {
    const msgFromJson =
      (data as any)?.message ?? (data as any)?.error ?? (data as any)?.detail;
    const msgFromText = textBody?.trim();
    const msg =
      (typeof msgFromJson === "string" && msgFromJson.trim())
        ? msgFromJson.trim()
        : msgFromText
          ? msgFromText
          : "Gagal mengambil riwayat peminjaman";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  const items = pickArray(data);

  // Common shapes: {page, limit, total} or {meta:{page,limit,total}}
  const meta = (data as any)?.meta ?? (data as any)?.pagination ?? {};
  const total = pickNumber(data, ["total", "totalItems", "count"], pickNumber(meta, ["total", "totalItems", "count"], items.length));
  const outPage = pickNumber(data, ["page"], pickNumber(meta, ["page"], page));
  const outLimit = pickNumber(data, ["limit", "take", "pageSize"], pickNumber(meta, ["limit", "take", "pageSize"], limit));

  return {
    items,
    page: Math.max(1, Math.trunc(outPage || page)),
    limit: Math.max(1, Math.trunc(outLimit || limit)),
    total: Math.max(0, Math.trunc(total || 0)),
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

export async function fetchAdminPeminjamanBuku(opts: {
  token: string;
  page?: number;
  limit?: number;
}): Promise<ListAdminPeminjamanResult> {
  const page = Math.max(1, Math.trunc(opts.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(opts.limit ?? 10)));

  const candidates = [
    `${API_URL}/peminjaman-buku/admin`,
    `${API_URL}/admin/peminjaman-buku`,
    `${API_URL}/peminjaman-buku`,
  ];

  let lastError: Error | null = null;

  for (const base of candidates) {
    const url = new URL(base);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    try {
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
        const msg = pickErrorMessage(data, textBody, "Gagal mengambil data peminjaman");
        lastError = new Error(`${res.status} ${res.statusText}: ${msg}`);
        continue;
      }

      const items = pickArray(data);
      const meta = (data as any)?.meta ?? (data as any)?.pagination ?? {};
      const total = pickNumber(
        data,
        ["total", "totalItems", "count"],
        pickNumber(meta, ["total", "totalItems", "count"], items.length)
      );
      const outPage = pickNumber(data, ["page"], pickNumber(meta, ["page"], page));
      const outLimit = pickNumber(
        data,
        ["limit", "take", "pageSize"],
        pickNumber(meta, ["limit", "take", "pageSize"], limit)
      );

      return {
        items,
        page: Math.max(1, Math.trunc(outPage || page)),
        limit: Math.max(1, Math.trunc(outLimit || limit)),
        total: Math.max(0, Math.trunc(total || 0)),
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error("Gagal mengambil data peminjaman");
    }
  }

  throw lastError ?? new Error("Gagal mengambil data peminjaman");
}

export async function updatePeminjamanBukuByAdmin(opts: {
  token: string;
  id: string;
  status: string;
  tanggal_peminjaman?: string;
  akhir_peminjaman?: string;
  tanggal_pengembalian?: string;
  status_perpanjangan?: string;
  akhir_perpanjangan?: string;
  catatan?: string;
}): Promise<any> {
  const res = await fetch(`${API_URL}/peminjaman-buku/${encodeURIComponent(opts.id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: opts.status,
      tanggal_peminjaman: opts.tanggal_peminjaman,
      akhir_peminjaman: opts.akhir_peminjaman,
      tanggal_pengembalian: opts.tanggal_pengembalian,
      status_perpanjangan: opts.status_perpanjangan,
      akhir_perpanjangan: opts.akhir_perpanjangan,
      catatan: opts.catatan,
    }),
  });

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal memperbarui peminjaman");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export async function setujuiPerpanjanganByAdmin(opts: {
  token: string;
  id: string;
}): Promise<any> {
  const res = await fetch(
    `${API_URL}/peminjaman-buku/${encodeURIComponent(opts.id)}/perpanjangan/setujui`,
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
    const msg = pickErrorMessage(
      data,
      textBody,
      "Gagal menyetujui perpanjangan",
    );
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export async function tolakPerpanjanganByAdmin(opts: {
  token: string;
  id: string;
  catatan?: string;
}): Promise<any> {
  const res = await fetch(
    `${API_URL}/peminjaman-buku/${encodeURIComponent(opts.id)}/perpanjangan/tolak`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ catatan: opts.catatan }),
    },
  );

  const { data, textBody } = await parseJsonOrText(res);
  if (!res.ok) {
    const msg = pickErrorMessage(data, textBody, "Gagal menolak perpanjangan");
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export async function ajukanPeminjamanBuku(opts: {
  token: string;
  bukuId: number;
  tanggal_peminjaman?: string;
  akhir_peminjaman?: string;
}): Promise<AjukanPeminjamanResponse> {
  const res = await fetch(`${API_URL}/peminjaman-buku/ajukan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bukuId: opts.bukuId,
      tanggal_peminjaman: opts.tanggal_peminjaman,
      akhir_peminjaman: opts.akhir_peminjaman,
    }),
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  const textBody = !isJson ? await res.text().catch(() => "") : "";

  if (!res.ok) {
    const msgFromJson =
      (data as any)?.message ?? (data as any)?.error ?? (data as any)?.detail;
    const msgFromText = textBody?.trim();
    const msg =
      (typeof msgFromJson === "string" && msgFromJson.trim())
        ? msgFromJson.trim()
        : msgFromText
          ? msgFromText
          : "Gagal mengajukan peminjaman";

    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }

  return data;
}

export async function ajukanPerpanjanganPeminjaman(opts: {
  token: string;
  loanId: string;
  durasiHari: number;
}): Promise<any> {
  const durasiHari = Math.max(1, Math.min(30, Math.trunc(opts.durasiHari)));

  const candidates = [
    `${API_URL}/peminjaman-buku/${encodeURIComponent(opts.loanId)}/perpanjangan`,
  ];

  let lastError: Error | null = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ durasiHari }),
      });

      const { data, textBody } = await parseJsonOrText(res);

      if (!res.ok) {
        const msg = pickErrorMessage(
          data,
          textBody,
          "Gagal mengajukan perpanjangan",
        );
        lastError = new Error(`${res.status} ${res.statusText}: ${msg}`);
        continue;
      }

      return data;
    } catch (e) {
      lastError =
        e instanceof Error
          ? e
          : new Error("Gagal mengajukan perpanjangan");
    }
  }

  throw lastError ?? new Error("Gagal mengajukan perpanjangan");
}