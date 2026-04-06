import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-xl border px-3.5 py-2.5 text-sm bg-[var(--ui-input-bg)] text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] transition-colors outline-none",
        "focus-visible:border-[var(--ui-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ui-primary)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
