"use client";

import * as React from "react";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function PrimaryButton({
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      className={[
        "w-full bg-gradient-to-r from-[#733015] to-[#8b5529]",
        "text-white py-3 rounded-lg flex items-center justify-center",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
