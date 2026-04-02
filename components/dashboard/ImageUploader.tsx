"use client";

import { useMemo, useRef, useState } from "react";

export interface UploadImageItem {
  id: string;
  url: string;
  name: string;
}

interface ImageUploaderProps {
  label?: string;
  required?: boolean;
  error?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "free";
  multiple?: boolean;
  value?: UploadImageItem | null;
  onChange?: (value: UploadImageItem | null) => void;
  items?: UploadImageItem[];
  onItemsChange?: (items: UploadImageItem[]) => void;
  maxFiles?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const RATIO_PADDING: Record<NonNullable<ImageUploaderProps["aspectRatio"]>, string> = {
  "16/9": "56.25%",
  "4/3": "75%",
  "1/1": "100%",
  free: "44%",
};

function readFileAsDataUrl(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(95, Math.round((event.loaded / event.total) * 100)));
      }
    };
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  label,
  required,
  error,
  aspectRatio = "16/9",
  multiple,
  value,
  onChange,
  items,
  onItemsChange,
  maxFiles = 16,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const list = items ?? [];
  const paddingTop = useMemo(() => RATIO_PADDING[aspectRatio], [aspectRatio]);

  async function processFiles(rawFiles: FileList | File[] | null) {
    if (!rawFiles) return;

    const files = Array.from(rawFiles);
    if (files.length === 0) return;

    setLocalError("");
    setUploading(true);
    setProgress(0);

    const uploaded: UploadImageItem[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setLocalError("Formats acceptes: JPG, PNG, WEBP.");
        continue;
      }

      if (file.size > MAX_BYTES) {
        setLocalError("Une image depasse 5MB.");
        continue;
      }

      const dataUrl = await readFileAsDataUrl(file, (pct) => {
        const weighted = Math.round(((i + pct / 100) / files.length) * 100);
        setProgress(weighted);
      });

      uploaded.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: dataUrl,
        name: file.name,
      });
    }

    setProgress(100);
    setUploading(false);

    if (!multiple) {
      onChange?.(uploaded[0] ?? null);
      return;
    }

    const merged = [...list, ...uploaded].slice(0, maxFiles);
    onItemsChange?.(merged);
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    void processFiles(event.target.files);
    event.target.value = "";
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void processFiles(event.dataTransfer.files);
  }

  function removeSingle() {
    onChange?.(null);
  }

  function removeItem(index: number) {
    onItemsChange?.(list.filter((_, idx) => idx !== index));
  }

  function onGalleryDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const next = [...list];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onItemsChange?.(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#64748B" }}>
          {label}
          {required ? <span style={{ color: "#EF4444" }}> *</span> : null}
        </p>
      )}

      {!multiple && value && (
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div style={{ position: "relative", paddingTop }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.url} alt={value.name} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-neutral-100">
            <p className="text-xs truncate" style={{ color: "#64748B" }}>{value.name}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                Remplacer
              </button>
              <button type="button" onClick={removeSingle} className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {(!value || multiple) && (
        <div
          className={[
            "rounded-xl border-2 border-dashed transition-colors cursor-pointer",
            dragging ? "border-blue-400 bg-blue-50/50" : "border-neutral-300 hover:border-blue-300",
          ].join(" ")}
          style={!multiple ? { position: "relative", paddingTop } : undefined}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div
            className={[
              !multiple ? "absolute inset-0" : "",
              "flex min-h-[110px] items-center justify-center px-4 py-6",
            ].join(" ")}
          >
            {uploading ? (
              <div className="w-full max-w-xs flex flex-col gap-2">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                  <div className="h-full transition-all duration-200" style={{ width: `${progress}%`, background: "#1D4ED8" }} />
                </div>
                <p className="text-xs text-center" style={{ color: "#64748B" }}>Upload {progress}%</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "#334155" }}>Glisser/deposer ou cliquer pour ajouter</p>
                <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>JPG, PNG, WEBP - max 5MB</p>
              </div>
            )}
          </div>
        </div>
      )}

      {multiple && list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {list.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
                setOverIndex(index);
              }}
              onDrop={() => onGalleryDrop(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className="rounded-lg border overflow-hidden bg-white"
              style={{ borderColor: overIndex === index ? "#60A5FA" : "#E2E8F0" }}
            >
              <div className="relative" style={{ aspectRatio: "4/3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-t border-neutral-100">
                <p className="text-[11px] truncate" style={{ color: "#64748B" }}>{item.name}</p>
                <button type="button" onClick={() => removeItem(index)} className="text-[11px] font-semibold" style={{ color: "#DC2626" }}>
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        multiple={multiple}
        onChange={onInputChange}
      />

      {(localError || error) && <p className="text-xs" style={{ color: "#DC2626" }}>{localError || error}</p>}
    </div>
  );
}
