"use client";

import React from "react";
import { useReveal } from "@/hooks/useReveal";

type RevealVariant = "up" | "left" | "right";

interface RevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: 0 | 100 | 200 | 300 | 400 | 500 | 600;
  className?: string;
}

const variantClass: Record<RevealVariant, string> = {
  up: "reveal",
  left: "reveal-left",
  right: "reveal-right",
};

const delayClass: Record<number, string> = {
  0: "",
  100: "delay-100",
  200: "delay-200",
  300: "delay-300",
  400: "delay-400",
  500: "delay-500",
  600: "delay-600",
};

export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
}: RevealProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={[variantClass[variant], delayClass[delay], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
