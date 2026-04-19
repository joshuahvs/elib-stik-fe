"use client";

import * as React from "react";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  labelClassName?: string;
};

export default function InputField({
  label,
  labelClassName,
  className,
  id,
  readOnly,
  disabled,
  ...props
}: InputFieldProps) {
  const inputId =
    id ??
    (label ? String(label).toLowerCase().replace(/\s+/g, "-") : undefined);

  const isDisabled = Boolean(disabled);
  const isReadOnly = Boolean(readOnly) && !isDisabled;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className={[
            "block text-sm mb-2",
            labelClassName ??
              (isDisabled ? "text-slate-500" : "text-black"),
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        readOnly={readOnly}
        disabled={disabled}
        {...props}
        className={[
          "w-full p-3 border rounded-lg transition-colors",
          isDisabled
            ? "bg-slate-100 border-slate-300 text-slate-500 placeholder:text-slate-400 cursor-not-allowed"
            : isReadOnly
              ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none"
              : "bg-white border-slate-900 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#733015]/20 focus:border-[#733015]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}