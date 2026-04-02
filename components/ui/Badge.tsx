"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "blue"
  | "purple"
  | "green"
  | "yellow"
  | "pink"
  | "gray"
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  pink: "bg-pink-100 text-pink-700",
  gray: "bg-neutral-100 text-neutral-600",
  default: "bg-primary-100 text-primary-700",
  secondary: "bg-neutral-100 text-neutral-700",
  destructive: "bg-red-100 text-red-700",
  outline: "bg-transparent border border-neutral-300 text-neutral-700",
};

function Badge({ children, variant = "gray", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
export default Badge;
