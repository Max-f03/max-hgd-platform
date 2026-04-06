"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--ui-text-secondary)]">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full border rounded-xl px-4 py-3 text-sm bg-[var(--ui-input-bg)] text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)]",
          "outline-none transition-colors duration-200",
          "focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-[var(--ui-primary)]",
          error
            ? "border-red-400 focus:ring-red-400 focus:border-red-400"
            : "border-[var(--ui-border)]",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export { Input };
export default Input;
