import { API_URL } from "@/app/lib/api";

function pickFirstString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export type DigitalSignedUrlResult = {
  signedUrl: string;
  expiresIn?: number;
  bucket?: string;
  path?: string;
};

/**
 * Panggil backend `GET /books/:id/digital` untuk mendapatkan signed URL Supabase Storage.
 * Backend contoh kamu mengembalikan `{ signedUrl, expiresIn, bucket, path }`.
 */
export async function fetchDigitalSignedUrl(opts: {
  token: string;
  bookId: string;
}): Promise<DigitalSignedUrlResult> {
  const res = await fetch(
    `${API_URL}/books/${encodeURIComponent(opts.bookId)}/digital`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (data as any)?.message ??
      (data as any)?.error ??
      "Gagal mengambil link buku digital";
    throw new Error(msg);
  }

  const signedUrl =
    pickFirstString(data, [
      "signedUrl",
      "signed_url",
      "url",
      "readUrl",
      "read_url",
    ]) ?? "";

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

export function openInNewTab(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  // if (!w) {
  //   // Popup blocked → fallback
  //   window.location.href = url;
  // }
}
