"use client";

import * as React from "react";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function InputField({
  label,
  className,
  id,
  ...props
}: InputFieldProps) {
  const inputId =
    id ??
    (label ? String(label).toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="block text-sm text-black mb-2">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        {...props}
        className={[
          "w-full p-3 border rounded-lg bg-white text-slate-900 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
