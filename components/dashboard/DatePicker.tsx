"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

interface DatePickerProps {
  label?: string;
  hint?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

function formatDisplay(value: string): string {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

function parseDate(value: string) {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1] - 1, day: parts[2] };
}

export default function DatePicker({
  label,
  hint,
  value,
  onChange,
  required,
  error,
  placeholder = "jj/mm/aaaa",
}: DatePickerProps) {
  const today = new Date();
  const parsed = parseDate(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(year: number, month: number, day: number) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${year}-${m}-${d}`);
    setOpen(false);
  }

  function selectToday() {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  }

  // Build 6-row grid (42 cells)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay();
  const firstDay = (firstDayRaw + 6) % 7; // Mon = 0
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { year: number; month: number; day: number; outside: boolean };
  const cells: Cell[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ year: y, month: m, day: daysInPrev - i, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year: viewYear, month: viewMonth, day: d, outside: false });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ year: y, month: m, day: d, outside: true });
  }

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <div className="flex items-baseline gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
            {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
          </label>
          {hint && <span className="text-[11px]" style={{ color: "#94A3B8" }}>{hint}</span>}
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-left outline-none bg-white transition-colors",
          open
            ? "border-blue-500 ring-2 ring-blue-500"
            : error
            ? "border-red-400"
            : "border-neutral-300 hover:border-neutral-400",
        ].join(" ")}
      >
        <span style={{ color: value ? "#0F172A" : "#94A3B8" }}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-2xl border border-neutral-200 overflow-hidden"
          style={{ width: 272, boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
              style={{ color: "#64748B" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
              style={{ color: "#64748B" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div className="px-3 pt-2.5 pb-3">
            {/* Day names */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FR.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-semibold py-1"
                  style={{ color: "#94A3B8" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((cell, i) => {
                const isSelected =
                  parsed?.year === cell.year &&
                  parsed?.month === cell.month &&
                  parsed?.day === cell.day;
                const isToday =
                  today.getFullYear() === cell.year &&
                  today.getMonth() === cell.month &&
                  today.getDate() === cell.day;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(cell.year, cell.month, cell.day)}
                    className="relative flex items-center justify-center h-8 rounded-lg text-[13px] transition-colors"
                    style={{
                      color: isSelected
                        ? "#fff"
                        : cell.outside
                        ? "#CBD5E1"
                        : isToday
                        ? "#1D4ED8"
                        : "#334155",
                      background: isSelected ? "#1D4ED8" : undefined,
                      fontWeight: isToday || isSelected ? 700 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "#F1F5F9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = "";
                    }}
                  >
                    {cell.day}
                    {isToday && !isSelected && (
                      <span
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: "#1D4ED8" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5">
            <button
              type="button"
              onClick={selectToday}
              className="text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: "#1D4ED8" }}
            >
              Aujourd&apos;hui
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "#94A3B8" }}
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>}
    </div>
  );
}
