"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";

type Size = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm" | "icon-xs" | "default";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  className?: string;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 hover:bg-primary-600 text-white rounded-full border border-transparent",
  default:
    "bg-primary-500 hover:bg-primary-600 text-white rounded-full border border-transparent",
  secondary:
    "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-full border border-transparent",
  outline:
    "bg-transparent hover:bg-neutral-100 text-neutral-900 rounded-full border border-neutral-300",
  ghost:
    "bg-transparent hover:bg-neutral-100 text-neutral-700 rounded-full border border-transparent",
  destructive:
    "bg-red-600 hover:bg-red-700 text-white rounded-full border border-transparent",
  link: "bg-transparent text-primary-500 underline-offset-4 hover:underline rounded-none border-transparent",
};

const sizeClasses: Record<Size, string> = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2.5 text-sm",
  default: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
  icon: "h-10 w-10 p-0",
  "icon-sm": "h-8 w-8 p-0",
  "icon-xs": "h-6 w-6 p-0",
};

export function buttonVariants({
  variant = "default",
  size = "md",
}: {
  variant?: string;
  size?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantClasses[variant as Variant] ?? variantClasses.default,
    sizeClasses[size as Size] ?? sizeClasses.md
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
  asChild: _asChild,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button };
export default Button;
