"use client";

import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export default function Select({
  label,
  placeholder = "Choisir une option",
  options,
  value,
  onChange,
  error,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${open ? "z-[80]" : ""} ${className}`} ref={ref}>
      {label && (
        <label className="text-xs text-neutral-500">{label}</label>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-sm transition-colors duration-200 outline-none bg-white text-left",
          open
            ? "border-primary-500 ring-2 ring-primary-500"
            : error
            ? "border-red-400"
            : "border-neutral-200 hover:border-neutral-300",
          selected ? "text-neutral-900" : "text-neutral-400",
        ].join(" ")}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[90] top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl overflow-hidden animate-scale-in shadow-[0_14px_32px_rgba(15,23,42,0.14)]">
          <ul className="py-1 max-h-52 overflow-y-auto">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={[
                    "w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between",
                    option.value === value
                      ? "bg-primary-50 text-primary-600 font-medium"
                      : "text-neutral-700 hover:bg-neutral-50",
                  ].join(" ")}
                >
                  {option.label}
                  {option.value === value && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
