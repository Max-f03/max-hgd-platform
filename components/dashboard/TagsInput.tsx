"use client";

import { useMemo, useRef, useState } from "react";

interface TagsInputProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  tags: string[];
  suggestions?: string[];
  error?: string;
  onChange: (tags: string[]) => void;
}

export default function TagsInput({
  label,
  placeholder = "Ajouter un tag",
  required,
  tags,
  suggestions = [],
  error,
  onChange,
}: TagsInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suggestions.filter((item) => {
      if (tags.includes(item)) return false;
      if (!q) return true;
      return item.toLowerCase().includes(q);
    });
  }, [query, suggestions, tags]);

  function addTag(raw: string) {
    const next = raw.trim().replace(/,+$/, "");
    if (!next) return;
    if (tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...tags, next]);
    setQuery("");
    setOpen(false);
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, idx) => idx !== index));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if ((event.key === "Enter" || event.key === ",") && query.trim()) {
      event.preventDefault();
      addTag(query);
      return;
    }

    if (event.key === "Backspace" && !query && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#64748B" }}>
          {label}
          {required ? <span style={{ color: "#DC2626" }}> *</span> : null}
        </p>
      ) : null}

      <div className="rounded-xl border border-neutral-300 bg-white px-2 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
        <div className="flex flex-wrap gap-1.5 items-center">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
              {tag}
              <button type="button" onClick={() => removeTag(index)} aria-label={`Supprimer ${tag}`} className="leading-none font-semibold">
                X
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 100);
            }}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="min-w-[160px] flex-1 text-sm outline-none bg-transparent"
            style={{ color: "#0F172A" }}
          />
        </div>
      </div>

      {open && filtered.length > 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm max-h-44 overflow-y-auto">
          {filtered.slice(0, 8).map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                addTag(item);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              style={{ color: "#334155" }}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p> : null}
      <p className="text-[11px]" style={{ color: "#94A3B8" }}>Valider avec Entree ou virgule.</p>
    </div>
  );
}
