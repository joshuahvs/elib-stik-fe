"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  buttonClassName?: string;
}

export default function Dropdown({
  label,
  options,
  value,
  onChange,
  className,
  labelClassName,
  valueClassName,
  buttonClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close if click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={["relative w-full", className].filter(Boolean).join(" ")}
      ref={dropdownRef}
    >
      {/* Label */}
      <label
        className={["block text-sm mb-2", labelClassName ?? "text-black"]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
      </label>

      {/* Input box */}
      <div
        onClick={() => setOpen(!open)}
        className={[
          "flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200",
          open
            ? "border-[#733015] ring-2 ring-[#733015]/20"
            : "border-gray-300",
          buttonClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className={["text-gray-800", valueClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {value}
        </span>

        {open ? (
          <ChevronUp size={20} color="black" />
        ) : (
          <ChevronDown size={20} color="black" />
        )}
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-xl py-2 z-50">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className="px-4 py-3 hover:bg-gray-100 text-black cursor-pointer transition"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
