"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import InputField from "@/app/components/InputField";
import PrimaryButton from "@/app/components/PrimaryButton";
import ErrorMessage, { getErrorMessage } from "@/app/components/ErrorMessage";
import { API_URL } from "@/app/lib/api";
import {
  fetchAdminLandingContent,
  updateAdminLandingContent,
  type LandingContent,
} from "@/app/lib/adminLandingContent";

function getRole(me: any): string | undefined {
  return me?.role ?? me?.data?.role ?? me?.user?.role ?? undefined;
}

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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

export default function AdminLandingContentPage() {
  const [token, setToken] = useState<string | null>(null);

  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("");
  const [vision, setVision] = useState<string>("");
  const [mission, setMission] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

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

  function applyToForm(data: LandingContent | null | undefined) {
    setTitle(String(data?.title ?? ""));
    setSubtitle(String(data?.subtitle ?? ""));
    setVision(String(data?.vision ?? ""));
    setMission(String(data?.mission ?? ""));
    setImageUrl(String(data?.image_url ?? ""));
  }

  async function load() {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdminLandingContent({ token });
      applyToForm(data);
    } catch (e: any) {
      setError(getErrorMessage(e, "Gagal memuat konten landing"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (meLoading) return;
    if (!token) return;
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, token, isAdmin]);

  const heroPreview = useMemo(() => {
    return {
      title: title.trim() || "(Belum ada judul)",
      subtitle: subtitle.trim() || "(Belum ada subjudul)",
      image_url: imageUrl.trim() || "(Belum ada image_url)",
    };
  }, [title, subtitle, imageUrl]);

  const visiMisiPreview = useMemo(() => {
    return {
      vision: vision.trim() || "(Belum ada visi)",
      mission: mission.trim() || "(Belum ada misi)",
    };
  }, [vision, mission]);

  async function submit() {
    if (!token) return;

    setSubmitSuccess(null);
    setSubmitError(null);

    const t = title.trim();
    if (!t) {
      setSubmitError("Judul (title) wajib diisi.");
      return;
    }

    const payload: LandingContent = {
      title: t,
      subtitle: normalizeOptionalText(subtitle),
      vision: normalizeOptionalText(vision),
      mission: normalizeOptionalText(mission),
      image_url: normalizeOptionalText(imageUrl),
    };

    try {
      setSubmitting(true);
      const updated = await updateAdminLandingContent({ token, payload });
      applyToForm(updated);
      setSubmitSuccess("Konten landing berhasil disimpan.");
    } catch (e: any) {
      setSubmitError(getErrorMessage(e, "Gagal menyimpan konten landing"));
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || isLoading || meLoading;

  return (
    <div className="min-h-screen bg-white">

      <main className="mx-auto max-w-[1100px] px-6 py-10">
        {!meLoading && !token ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Konten Landing Page
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
              Konten Landing Page
            </h1>
            <p className="mt-2 text-slate-600">
              Halaman ini hanya bisa diakses oleh admin.
            </p>
          </div>
        ) : null}

        {!meLoading && token && isAdmin ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                Konten Landing Page
              </h1>
            </div>

            <ErrorMessage error={error} className="mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <section className="rounded-2xl border p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Section: HERO
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Title</dt>
                    <dd className="text-slate-900 font-medium">
                      {heroPreview.title}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Subtitle</dt>
                    <dd className="text-slate-900 font-medium">
                      {heroPreview.subtitle}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Image URL</dt>
                    <dd className="text-slate-900 break-all font-medium">
                      {heroPreview.image_url}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Section: VISI & MISI
                </h2>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Visi</dt>
                    <dd className="text-slate-900 whitespace-pre-line">
                      {visiMisiPreview.vision}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Misi</dt>
                    <dd className="text-slate-900 whitespace-pre-line">
                      {visiMisiPreview.mission}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <section className="rounded-2xl border p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Edit Konten
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul landing"
                  disabled={disabled}
                />

                <InputField
                  label="Subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Subjudul landing (opsional)"
                  disabled={disabled}
                />

                <div className="md:col-span-2">
                  <InputField
                    label="Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    disabled={disabled}
                  />
                </div>

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Visi"
                    value={vision}
                    onChange={setVision}
                    placeholder="Teks visi (opsional)"
                    rows={5}
                  />
                </div>

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Misi"
                    value={mission}
                    onChange={setMission}
                    placeholder="Teks misi (opsional)"
                    rows={5}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <PrimaryButton
                  type="button"
                  onClick={submit}
                  disabled={disabled || submitting}
                  className="md:col-span-1"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </PrimaryButton>

                <div className="md:col-span-2">
                  <ErrorMessage error={submitError} />
                  {submitSuccess ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                      {submitSuccess}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
