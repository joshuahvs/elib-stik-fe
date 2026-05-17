"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  ADMIN_BLOG_MAX_FILE_BYTES,
  createAdminBlog,
  deleteAdminBlog,
  fetchAdminBlogs,
  updateAdminBlog,
  validateCoverImage,
  type AdminBlog,
  type BlogStatus,
} from "@/app/lib/adminBlogs";

function getRole(me: any): string | undefined {
  return me?.role ?? me?.data?.role ?? me?.user?.role ?? undefined;
}

function formatId(value: string, index: number) {
  if (!value) return String(index + 1);
  if (/^\d+$/.test(value)) return value;
  return value.slice(0, 8);
}

function formatDateParts(iso?: string | null) {
  if (!iso) {
    return { dayMonth: "-", year: "" };
  }

  const date = new Date(iso);
  const dayMonth = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);

  const year = new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);

  return { dayMonth, year };
}

function statusBadge(status?: string | null) {
  const s = (status ?? "draft").toLowerCase();
  if (s === "published") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function statusLabel(status?: string | null) {
  const s = (status ?? "draft").toLowerCase();
  if (s === "published") return "Published";
  return "Draft";
}

function bytesLabel(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let n = bytes;
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024;
    idx += 1;
  }
  return `${n.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
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

export default function AdminBlogsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBlog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBlog | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<BlogStatus>("draft");

  const [cover, setCover] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  async function loadBlogs() {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdminBlogs({ token });
      setBlogs(data ?? []);
    } catch (e: any) {
      setError(getErrorMessage(e, "Gagal memuat data blog"));
      setBlogs([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;
    loadBlogs();
  }, [meLoading, token, isAdmin]);

  useEffect(() => {
    if (!cover) {
      setCoverPreview(existingCoverUrl);
      return;
    }

    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover, existingCoverUrl]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setAuthor("");
    setCategory("");
    setExcerpt("");
    setContent("");
    setStatus("draft");
    setCover(null);
    setExistingCoverUrl(null);
    setSubmitError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function openEdit(blog: AdminBlog) {
    setEditing(blog);
    setTitle(String(blog.title ?? ""));
    setAuthor(String(blog.author ?? ""));
    setCategory(String(blog.category ?? ""));
    setExcerpt(String(blog.excerpt ?? ""));
    setContent(String(blog.content ?? ""));
    setStatus((blog.status ?? "draft") as BlogStatus);
    setCover(null);
    setExistingCoverUrl(blog.cover_url ?? null);
    setSubmitError(null);
    setSuccess(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setCover(null);
    setExistingCoverUrl(null);
    setSubmitError(null);
  }

  function onPickCover() {
    fileInputRef.current?.click();
  }

  function onCoverSelected(file: File | null) {
    const msg = validateCoverImage(file);
    if (msg) {
      setSubmitError(msg);
      setCover(null);
      return;
    }
    setSubmitError(null);
    setCover(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const titleTrim = title.trim();
    const authorTrim = author.trim();
    const categoryTrim = category.trim();
    const excerptTrim = excerpt.trim();
    const contentTrim = content.trim();

    if (!titleTrim) return setSubmitError("Judul artikel wajib diisi");
    if (!authorTrim) return setSubmitError("Penulis wajib diisi");
    if (!categoryTrim) return setSubmitError("Kategori wajib diisi");
    if (!excerptTrim) return setSubmitError("Ringkasan wajib diisi");
    if (!contentTrim) return setSubmitError("Konten wajib diisi");

    const coverMsg = validateCoverImage(cover);
    if (coverMsg) return setSubmitError(coverMsg);

    try {
      setSubmitting(true);
      setSubmitError(null);

      if (editing) {
        await updateAdminBlog({
          token,
          id: editing.id,
          title: titleTrim,
          author: authorTrim,
          category: categoryTrim,
          excerpt: excerptTrim,
          content: contentTrim,
          status,
          cover: cover ?? undefined,
        });
        setSuccess("Blog berhasil diperbarui.");
      } else {
        await createAdminBlog({
          token,
          title: titleTrim,
          author: authorTrim,
          category: categoryTrim,
          excerpt: excerptTrim,
          content: contentTrim,
          status,
          cover: cover ?? undefined,
        });
        setSuccess("Blog berhasil ditambahkan.");
      }

      await loadBlogs();
      setModalOpen(false);
    } catch (e: any) {
      setSubmitError(getErrorMessage(e, "Gagal menyimpan blog"));
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
      await deleteAdminBlog({ token, id: deleteTarget.id });
      setSuccess("Blog berhasil dihapus.");
      setDeleteTarget(null);
      await loadBlogs();
    } catch (e: any) {
      setError(getErrorMessage(e, "Gagal menghapus blog"));
    } finally {
      setDeleteLoading(false);
    }
  }

  const maxCoverSizeLabel = bytesLabel(ADMIN_BLOG_MAX_FILE_BYTES);

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!meLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Manajemen Blog
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
              Manajemen Blog
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
                  Manajemen Blog
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Kelola artikel blog untuk E-Library
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  <span className="text-lg leading-none">+</span>
                  Tambah Blog
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
                  Total {blogs.length} artikel
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
                        Penulis
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left font-semibold">
                        Tanggal
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
                          Memuat data blog...
                        </td>
                      </tr>
                    ) : blogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-6 text-center text-slate-500"
                        >
                          Belum ada blog.
                        </td>
                      </tr>
                    ) : (
                      blogs.map((blog, index) => {
                        const dateValue =
                          blog.published_at ??
                          blog.created_at ??
                          blog.updated_at;
                        const dateParts = formatDateParts(dateValue);
                        const badge = statusBadge(blog.status ?? "draft");

                        return (
                          <tr key={blog.id} className="text-slate-700">
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {formatId(String(blog.id), index)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {blog.cover_url ? (
                                  <img
                                    src={blog.cover_url}
                                    alt={String(blog.title ?? "Cover")}
                                    className="h-12 w-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-slate-100" />
                                )}
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {blog.title ?? "(Tanpa Judul)"}
                                  </div>
                                  <div className="text-xs text-slate-500 line-clamp-1">
                                    {blog.excerpt ?? "-"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">{blog.author ?? "-"}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                {blog.category ?? "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              <div>{dateParts.dayMonth}</div>
                              <div>{dateParts.year}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge}`}
                              >
                                {statusLabel(blog.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(blog)}
                                  className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                                >
                                  Edit
                                </button>
                                {blog.status !== "draft" ? (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(blog)}
                                    className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                                  >
                                    Hapus
                                  </button>
                                ) : null}
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
                {editing ? "Edit Blog" : "Tambah Blog Baru"}
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
                label="Judul Artikel *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul artikel"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Penulis *"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nama penulis"
                />
                <InputField
                  label="Kategori *"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Tutorial, Akademik, dll"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-black">
                  Gambar Cover
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onCoverSelected(e.target.files?.[0] ?? null)}
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={onPickCover}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onPickCover();
                  }}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500"
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Preview cover"
                      className="h-32 w-full max-w-xs rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                      ^
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-700">
                    Klik untuk upload gambar
                  </div>
                  <div className="text-xs text-slate-400">
                    PNG, JPG, atau JPEG (Max. {maxCoverSizeLabel})
                  </div>
                </div>

                {cover ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCover(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 text-xs text-slate-500 underline"
                  >
                    Hapus cover
                  </button>
                ) : null}
              </div>

              <TextAreaField
                label="Ringkasan (Excerpt) *"
                value={excerpt}
                onChange={setExcerpt}
                placeholder="Ringkasan singkat artikel (1-2 kalimat)"
                rows={3}
              />

              <TextAreaField
                label="Konten Lengkap *"
                value={content}
                onChange={setContent}
                placeholder="Tulis konten lengkap artikel di sini..."
                rows={6}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="w-full">
                  <label className="block text-sm mb-2 text-black">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
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
                      : "Tambah Blog"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="px-6 py-5 border-b">
              <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              Apakah Anda yakin ingin menghapus blog ini? Tindakan ini tidak
              dapat dibatalkan.
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
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
