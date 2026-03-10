import { API_URL } from "@/app/lib/api";

export type LoginLogStatus = "success" | "failed";
export type LoginLogRole = "mahasiswa" | "dosen" | "umum" | "admin" | string;

export type LoginLog = {
  id: string;
  user_id: string | null;
  email: string | null;
  role: string | null;
  status: LoginLogStatus;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type LoginLogsResponse =
  | { data: LoginLog[]; total?: number; page?: number; limit?: number }
  | LoginLog[];

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchLoginLogs(opts: {
  token: string;
  from?: string;
  to?: string;
  status?: LoginLogStatus | "";
  role?: LoginLogRole | "";
  email?: string;
  page?: number;
  limit?: number;
}) {
  const qs = buildQuery({
    from: opts.from,
    to: opts.to,
    status: opts.status,
    role: opts.role,
    email: opts.email,
    page: opts.page ?? 1,
    limit: opts.limit ?? 10,
  });

  const res = await fetch(`${API_URL}/admin/login-logs${qs}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${opts.token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? "Gagal mengambil data login logs";
    throw new Error(msg);
  }

  if (Array.isArray(data)) {
    return { data };
  }

  return data as { data: LoginLog[]; total?: number; page?: number; limit?: number };
}