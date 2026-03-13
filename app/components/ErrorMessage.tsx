import React from "react";

function firstNonEmptyString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const s = firstNonEmptyString(item);
      if (s) return s;
    }
  }

  return null;
}

function pickFirstFromObject(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;

  // Common DTO / backend shapes
  const direct = firstNonEmptyString(
    obj.message ?? obj.error ?? obj.detail ?? obj.msg ?? obj.reason,
  );
  if (direct) return direct;

  // Fetch/Axios nested shapes
  const nested = firstNonEmptyString(
    obj.data?.message ??
      obj.data?.error ??
      obj.data?.detail ??
      obj.response?.data?.message ??
      obj.response?.data?.error ??
      obj.response?.data?.detail,
  );
  if (nested) return nested;

  // Validation error bags: { errors: { field: ["msg"] } }
  const bag =
    obj.errors ??
    obj.data?.errors ??
    obj.response?.data?.errors ??
    obj.error?.errors;
  if (bag && typeof bag === "object") {
    for (const v of Object.values(bag)) {
      const s = firstNonEmptyString(v);
      if (s) return s;
    }
  }

  // Sometimes backend returns { field: ["msg"] } directly
  for (const v of Object.values(obj)) {
    const s = firstNonEmptyString(v);
    if (s) return s;
  }

  return null;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan.",
): string {
  const fromString = firstNonEmptyString(error);
  if (fromString) return fromString;

  if (error instanceof Error) {
    const msg = firstNonEmptyString(error.message);
    return msg ?? fallback;
  }

  if (error && typeof error === "object") {
    const picked = pickFirstFromObject(error as any);
    if (picked) return picked;
  }

  return fallback;
}

type Props = {
  error?: unknown;
  fallback?: string;
  className?: string;
};

export default function ErrorMessage({ error, fallback, className }: Props) {
  if (error == null) return null;

  const message = getErrorMessage(error, fallback ?? "Terjadi kesalahan.");
  if (!message) return null;

  return (
    <div
      role="alert"
      className={[
        "rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {message}
    </div>
  );
}
