import { API_URL } from "@/app/lib/api";

export type LandingContent = {
  title?: string | null;
  subtitle?: string | null;
  vision?: string | null;
  mission?: string | null;
  image_url?: string | null;
};

export type LandingSection = {
  name: string;
  fields: Array<{ key: string; value: string | null }>;
};

export type AdminLandingContentResponse = {
  content: LandingContent;
  sections: LandingSection[];
};

function normalizeAdminLandingResponse(data: any): AdminLandingContentResponse {
  const hasContentWrapper = data && typeof data === "object" && "content" in data;

  const content: LandingContent = hasContentWrapper
    ? {
        title: data?.content?.title ?? null,
        subtitle: data?.content?.subtitle ?? null,
        vision: data?.content?.vision ?? null,
        mission: data?.content?.mission ?? null,
        image_url: data?.content?.image_url ?? null,
      }
    : {
        title: data?.title ?? null,
        subtitle: data?.subtitle ?? null,
        vision: data?.vision ?? null,
        mission: data?.mission ?? null,
        image_url: data?.image_url ?? null,
      };

  const fallbackSections: LandingSection[] = [
    {
      name: "HERO",
      fields: [
        { key: "title", value: content.title ?? null },
        { key: "subtitle", value: content.subtitle ?? null },
        { key: "image_url", value: content.image_url ?? null },
      ],
    },
    {
      name: "VISI_MISI",
      fields: [
        { key: "vision", value: content.vision ?? null },
        { key: "mission", value: content.mission ?? null },
      ],
    },
  ];

  const sections = Array.isArray(data?.sections)
    ? data.sections
        .map((section: any) => ({
          name: String(section?.name ?? "").trim(),
          fields: Array.isArray(section?.fields)
            ? section.fields.map((f: any) => ({
                key: String(f?.key ?? "").trim(),
                value:
                  f?.value == null
                    ? null
                    : typeof f.value === "string"
                      ? f.value
                      : String(f.value),
              }))
            : [],
        }))
        .filter((section: any) => section.name)
    : fallbackSections;

  return { content, sections: sections.length ? sections : fallbackSections };
}

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

  return normalizeAdminLandingResponse(data);
}

export async function updateAdminLandingContent(opts: {
  token: string;
  payload: LandingContent;
}) {
  const res = await fetch(`${API_URL}/admin/landing/content`, {
    method: "PUT",
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

  return normalizeAdminLandingResponse(data);
}
