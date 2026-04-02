"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientForm, { type ClientData } from "@/components/dashboard/ClientForm";

export default function NewClientPage() {
  const router = useRouter();

  function handleSubmit(data: ClientData) {
    console.log("Nouveau client :", data);
    router.push("/dashboard/clients");
  }

  function handleCancel() {
    router.push("/dashboard/clients");
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <nav className="flex items-center gap-2 text-sm text-neutral-500" style={{ animation: "reveal-up 0.7s ease-out both" }}>
        <Link
          href="/dashboard/clients"
          className="hover:text-neutral-700 transition-colors"
        >
          Clients
        </Link>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18" height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-300"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-neutral-900 font-medium">Nouveau client</span>
      </nav>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6" style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "130ms" }}>
        <h2 className="text-base font-semibold text-neutral-900 mb-6">
          Informations du client
        </h2>
        <ClientForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
