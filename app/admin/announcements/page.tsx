"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  updateAdminAnnouncement,
  type AdminAnnouncement,
  type AnnouncementPriority,
} from "@/app/lib/adminAnnouncements";

function getRole(me: any): string | undefined {
  return me?.role ?? me?.data?.role ?? me?.user?.role ?? undefined;
}

function formatId(value: string, index: number) {
  if (!value) return String(index + 1);
  if (/^\d+$/.test(value)) return value;
  return value.slice(0, 8);
}

function formatDateParts(value?: string | null) {
  if (!value) {
    return { dayMonth: "-", year: "" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { dayMonth: String(value), year: "" };
  }

  const dayMonth = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(parsed);

  const year = new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(parsed);

  return { dayMonth, year };
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(parsed);
}

function priorityLabel(value?: string | null) {
  const s = (value ?? "").toLowerCase();
  if (s === "urgent") return "Urgent";
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  if (s === "low") return "Low";
  return value ? String(value) : "-";
}

function normalizePriorityValue(value?: string | null): AnnouncementPriority {
  const s = (value ?? "").toLowerCase();
  if (s === "urgent" || s === "high" || s === "medium" || s === "low") {
    return s;
  }
  return "medium";
}

function priorityBadge(value?: string | null) {
  const s = (value ?? "").toLowerCase();
  if (s === "urgent") return "bg-rose-100 text-rose-600";
  if (s === "high") return "bg-orange-100 text-orange-600";
  if (s === "medium") return "bg-blue-100 text-blue-600";
  if (s === "low") return "bg-slate-100 text-slate-600";
  return "bg-slate-100 text-slate-600";
}

function resolvePublishedAt(announcement: AdminAnnouncement) {
  return (
    announcement.published_at ??
    announcement.created_at ??
    announcement.date ??
    null
  );
}

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
}

function statusLabel(announcement: AdminAnnouncement) {
  const expired = isExpired(announcement.expires_at ?? null);
  if (announcement.is_active === false || expired) return "Nonaktif";
  return "Aktif";
}

function statusBadge(announcement: AdminAnnouncement) {
  const label = statusLabel(announcement);
  if (label === "Aktif") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const id = useMemo(
    () => props.label.toLowerCase().replace(/\s+/g, "-"),
    [props.label],
  );

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm mb-2 text-black">
        {props.label}
      </label>
      <textarea
        id={id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={props.rows ?? 4}
        className={[
          "w-full p-3 border rounded-lg bg-white text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
        ].join(" ")}
      />
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAnnouncement | null>(
    null,
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("medium");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);

    if (!t) {
      setMeLoading(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => r.json())
      .then((me) => {
        const role = getRole(me);
        setIsAdmin(role === "admin");
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setMeLoading(false));
  }, []);

  async function loadAnnouncements() {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdminAnnouncements({ token });
      setAnnouncements(data ?? []);
    } catch (e: any) {
      setError(getErrorMessage(e, "Gagal memuat data pengumuman"));
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;
    loadAnnouncements();
  }, [meLoading, token, isAdmin]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setContent("");
    setPriority("medium");
    setExpiresAt("");
    setIsActive(true);
    setSubmitError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEdit(announcement: AdminAnnouncement) {
    setEditing(announcement);
    setTitle(String(announcement.title ?? ""));
    setContent(String(announcement.content ?? ""));
    setPriority(normalizePriorityValue(announcement.priority ?? null));
    setExpiresAt(toDateInputValue(announcement.expires_at ?? null));
    setIsActive(announcement.is_active !== false);
    setSubmitError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSubmitError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const titleTrim = title.trim();
    const contentTrim = content.trim();

    if (!titleTrim) return setSubmitError("Judul pengumuman wajib diisi");
    if (!contentTrim) return setSubmitError("Konten pengumuman wajib diisi");
    if (!priority) return setSubmitError("Prioritas wajib dipilih");
    if (!expiresAt.trim()) {
      return setSubmitError("Tanggal kadaluarsa wajib diisi");
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      if (editing) {
        await updateAdminAnnouncement({
          token,
          id: editing.id,
          title: titleTrim,
          content: contentTrim,
          priority,
          expires_at: expiresAt,
          is_active: isActive,
        });
        setSuccess("Pengumuman berhasil diperbarui.");
      } else {
        await createAdminAnnouncement({
          token,
          title: titleTrim,
          content: contentTrim,
          priority,
          expires_at: expiresAt,
          is_active: isActive,
        });
        setSuccess("Pengumuman berhasil ditambahkan.");
      }

      await loadAnnouncements();
      setModalOpen(false);
    } catch (e: any) {
      setSubmitError(getErrorMessage(e, "Gagal menyimpan pengumuman"));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!token || !deleteTarget) return;

    try {
      setDeleteLoading(true);
      setError(null);
      setSuccess(null);
      await deleteAdminAnnouncement({ token, id: deleteTarget.id });
      setSuccess("Pengumuman berhasil dihapus.");
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (e: any) {
      setError(getErrorMessage(e, "Gagal menghapus pengumuman"));
    } finally {
      setDeleteLoading(false);
    }
  }

  const priorityOptions = [
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!meLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Manajemen Pengumuman
            </h1>
            <p className="mt-2 text-slate-600">Kamu belum login.</p>
            <div className="mt-6">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {!meLoading && token && !isAdmin ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Manajemen Pengumuman
            </h1>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Manajemen Pengumuman
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Kelola informasi penting untuk pengguna
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Tambah Pengumuman
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  Kembali
                </button>
              </div>
            </div>

            {success ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
            ) : null}

            <ErrorMessage error={error} className="mt-6" />

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <p className="text-sm text-slate-600">
                  Total {announcements.length} pengumuman
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">ID</th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Judul
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Prioritas
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Tanggal Publikasi
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Tanggal Kadaluarsa
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-6 text-center text-slate-500"
                        >
                          Memuat data pengumuman...
                        </td>
                      </tr>
                    ) : announcements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-6 text-center text-slate-500"
                        >
                          Belum ada pengumuman.
                        </td>
                      </tr>
                    ) : (
                      announcements.map((announcement, index) => {
                        const publishedValue = resolvePublishedAt(announcement);
                        const publishedParts = formatDateParts(publishedValue);
                        const expiresParts = formatDateParts(
                          announcement.expires_at ?? null,
                        );
                        const badge = priorityBadge(
                          announcement.priority ?? null,
                        );
                        const status = statusBadge(announcement);

                        return (
                          <tr key={announcement.id} className="text-slate-700">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {formatId(String(announcement.id), index)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">
                                {announcement.title ?? "(Tanpa Judul)"}
                              </div>
                              <div className="text-xs text-slate-500 line-clamp-1">
                                {announcement.content ?? "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge}`}
                              >
                                {priorityLabel(announcement.priority ?? null)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              <div>{publishedParts.dayMonth}</div>
                              <div>{publishedParts.year}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              <div>{expiresParts.dayMonth}</div>
                              <div>{expiresParts.year}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status}`}
                              >
                                {statusLabel(announcement)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(announcement)}
                                  className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                                >
                                  <Pencil size={12} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(announcement)}
                                  className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                                >
                                  <Trash2 size={12} />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Edit Pengumuman" : "Tambah Pengumuman Baru"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-700"
              >
                x
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              <InputField
                label="Judul Pengumuman *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul pengumuman"
              />

              <TextAreaField
                label="Konten Pengumuman *"
                value={content}
                onChange={setContent}
                placeholder="Tulis detail pengumuman di sini..."
                rows={5}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="w-full">
                  <label className="block text-sm mb-2 text-black">
                    Prioritas *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]"
                  >
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Tanggal Kadaluarsa *"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">
                      Aktifkan pengumuman ini
                    </span>
                    <span className="block text-xs text-slate-500 mt-1">
                      Pengumuman yang dinonaktifkan tidak akan ditampilkan
                      kepada pengguna.
                    </span>
                  </span>
                </label>
              </div>

              <ErrorMessage error={submitError} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  disabled={submitting}
                >
                  Batal
                </button>
                <PrimaryButton
                  type="submit"
                  className="w-auto px-6"
                  disabled={submitting}
                >
                  {submitting
                    ? "Menyimpan..."
                    : editing
                      ? "Simpan Perubahan"
                      : "Tambah Pengumuman"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="px-6 py-5 border-b">
              <h3 className="text-lg font-semibold text-slate-900">
                Konfirmasi Hapus
              </h3>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini
              tidak dapat dibatalkan.
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
