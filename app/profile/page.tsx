"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProfileForm = {
  namaLengkap: string;
  username: string;
  email: string;
  nomorTelepon: string;
  tanggalLahir: string;
  nim: string;
  nomorDosen: string;
  role: string;
  fotoProfil: string;
};

const initialForm: ProfileForm = {
  namaLengkap: "",
  username: "",
  email: "",
  nomorTelepon: "",
  tanggalLahir: "",
  nim: "",
  nomorDosen: "",
  role: "",
  fotoProfil: "",
};

function normalizeProfileToForm(data: any): ProfileForm {
  return {
    namaLengkap: data?.nama_lengkap ?? "",
    username: data?.username ?? "",
    email: data?.email ?? "",
    nomorTelepon: data?.phone ?? "",
    tanggalLahir: data?.tanggal_lahir ?? "",
    nim: data?.nim ?? "",
    nomorDosen: data?.nomor_dosen ?? "",
    role: data?.role ?? "",
    fotoProfil: data?.foto_profil ?? "",
  };
}

function getRoleLabel(role?: string) {
  if (!role) return "";
  if (role === "mahasiswa") return "Mahasiswa";
  if (role === "dosen") return "Dosen";
  if (role === "umum") return "Umum";
  if (role === "admin") return "Admin";
  return role;
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [initialSnapshot, setInitialSnapshot] = useState<ProfileForm>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const nextToken = localStorage.getItem("token");
    setToken(nextToken);

    if (!nextToken) {
      setIsLoading(false);
      return;
    }

    setError(null);

    fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${nextToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Sesi login tidak valid");
        }

        return res.json();
      })
      .then((data) => {
        setUser(data);
        const normalized = normalizeProfileToForm(data);
        setForm(normalized);
        setInitialSnapshot(normalized);
        setPreviewUrl(normalized.fotoProfil || "");
        setError(null);
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("token");
        setToken(null);
        setError(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFile) return;

    const nextPreview = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [selectedFile]);

  const role = form.role;
  const roleLabel = useMemo(() => getRoleLabel(role), [role]);

  const displayName = useMemo(() => {
    return form.namaLengkap?.trim() ? form.namaLengkap : "Nama Lengkap";
  }, [form.namaLengkap]);

  const identifierLabel =
    role === "mahasiswa" ? "NIM" : role === "dosen" ? "Nomor Dosen" : "";

  const identifierValue =
    role === "mahasiswa" ? form.nim : role === "dosen" ? form.nomorDosen : "";

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePickPhoto() {
    if (!isEditing) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File foto profil harus berupa gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran foto profil maksimal 2MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);
  }

  function handleStartEdit(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setError(null);
    setSuccessMessage(null);
    setForm(initialSnapshot);
    setSelectedFile(null);
    setPreviewUrl(initialSnapshot.fotoProfil || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsEditing(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) return;

    setError(null);
    setSuccessMessage(null);

    if (!form.namaLengkap.trim()) {
      setError("Nama lengkap tidak boleh kosong.");
      return;
    }

    if (!form.username.trim()) {
      setError("Username tidak boleh kosong.");
      return;
    }

    if (!form.nomorTelepon.trim()) {
      setError("Nomor telepon tidak boleh kosong.");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("nama_lengkap", form.namaLengkap.trim());
      formData.append("username", form.username.trim());
      formData.append("phone", form.nomorTelepon.trim());

      if (form.tanggalLahir) {
        formData.append("tanggal_lahir", form.tanggalLahir);
      }

      if (selectedFile) {
        formData.append("foto_profil", selectedFile);
      }

      const res = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(getErrorMessage(data, "Gagal memperbarui profil."));
      }

      const updated = data?.data ?? null;
      const normalized = normalizeProfileToForm(updated);

      setUser(updated);
      setForm(normalized);
      setInitialSnapshot(normalized);
      setPreviewUrl(normalized.fotoProfil || "");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsEditing(false);
      setSuccessMessage("Profil berhasil diperbarui.");
      setError(null);

      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memperbarui profil."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!isLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">Akun</h1>
            <p className="mt-2 text-slate-600">
              Kamu belum login. Silakan masuk untuk melihat profil.
            </p>
            <div className="mt-6">
              <Link href="/auth/login" className="underline text-slate-900">
                Ke halaman login
              </Link>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="max-w-xl mx-auto text-center text-slate-600">
            Memuat profil…
          </div>
        ) : null}

        {!isLoading && token ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <section className="flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <button
                  type="button"
                  onClick={handlePickPhoto}
                  className={[
                    "w-44 h-44 rounded-full border flex items-center justify-center overflow-hidden bg-white",
                    isEditing ? "cursor-pointer hover:opacity-90" : "cursor-default",
                  ].join(" ")}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Foto profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-100" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {isEditing ? (
                  <button
                    type="button"
                    onClick={handlePickPhoto}
                    className="mt-3 text-sm text-[#733015] underline"
                  >
                    Ganti foto profil
                  </button>
                ) : null}

                <h1 className="mt-6 text-4xl font-bold text-slate-900 text-center">
                  {displayName}
                </h1>

                {roleLabel ? (
                  <p className="mt-2 text-slate-500 font-medium text-center">
                    {roleLabel}
                  </p>
                ) : null}

                <div className="mt-8 w-full max-w-sm flex flex-col gap-3">
                  {!isEditing ? (
                    <PrimaryButton type="button" onClick={handleStartEdit}>
                      Ubah Profil
                    </PrimaryButton>
                  ) : (
                    <>
                      <PrimaryButton
                        type="submit"
                        form="profile-form"
                        disabled={isSaving}
                      >
                        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                      </PrimaryButton>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white font-medium text-slate-900 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>

            <section className="w-full">
              <div className="rounded-2xl border p-8 lg:p-10">
                <ErrorMessage error={error} className="mb-4" />

                {successMessage ? (
                  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    {successMessage}
                  </div>
                ) : null}

                <form
                  id="profile-form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                >
                  {identifierLabel ? (
                    <InputField
                      label={identifierLabel}
                      name={role === "mahasiswa" ? "nim" : "nomorDosen"}
                      placeholder={identifierLabel}
                      value={identifierValue}
                      readOnly
                      disabled
                    />
                  ) : null}

                  <InputField
                    label="Role"
                    name="role"
                    value={roleLabel}
                    readOnly
                    disabled
                  />

                  <InputField
                    label="Nama Lengkap"
                    name="namaLengkap"
                    placeholder="Nama Lengkap"
                    value={form.namaLengkap}
                    onChange={handleChange}
                    readOnly={!isEditing}
                  />

                  <InputField
                    label="Username"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    readOnly={!isEditing}
                  />

                  <InputField
                    label="E-mail"
                    name="email"
                    type="email"
                    placeholder="E-mail"
                    value={form.email}
                    readOnly
                    disabled
                  />

                  <InputField
                    label="Tanggal Lahir"
                    name="tanggalLahir"
                    type={isEditing ? "date" : "text"}
                    placeholder="YYYY-MM-DD"
                    value={form.tanggalLahir}
                    onChange={handleChange}
                    readOnly={!isEditing}
                  />

                  <InputField
                    label="Nomor Telepon"
                    name="nomorTelepon"
                    placeholder="08xxxxxxxxxx"
                    value={form.nomorTelepon}
                    onChange={handleChange}
                    readOnly={!isEditing}
                  />
                </form>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}