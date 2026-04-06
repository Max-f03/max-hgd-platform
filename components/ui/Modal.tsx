"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 animate-fade-in px-4"
    >
      <div className="relative w-full max-w-lg rounded-2xl animate-scale-in" style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", transition: "background 0.25s ease, border-color 0.25s ease" }}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--ui-border)" }}>
          {title && (
            <h2 className="text-lg font-semibold" style={{ color: "var(--ui-text)" }}>{title}</h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200"
            style={{ color: "var(--ui-text-muted)" }}
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12" height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-6" style={{ color: "var(--ui-text-secondary)" }}>{children}</div>
      </div>
    </div>
  );
}
