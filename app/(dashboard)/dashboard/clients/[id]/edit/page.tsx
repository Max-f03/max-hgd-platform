"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ClientForm, { type ClientData } from "@/components/dashboard/ClientForm";

type ClientApi = {
  id: string;
  name: string;
  email: string;
  company: string;
  status: "lead" | "active" | "completed";
  phone?: string;
  notes?: string;
};

function mapClientToInitial(client: ClientApi): Partial<ClientData> {
  return {
    name: client.name,
    email: client.email,
    company: client.company === "-" ? "" : client.company,
    phone: client.phone ?? "",
    status: client.status,
    notes: client.notes ?? "",
  };
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clientId = String(params?.id ?? "");

  const [initialData, setInitialData] = useState<Partial<ClientData> | null>(null);
  const [loading, setLoading] = useState(true);

  const heading = useMemo(
    () => initialData?.name?.trim() || "Modifier client",
    [initialData?.name]
  );

  useEffect(() => {
    async function loadClient() {
      try {
        const response = await fetch("/api/clients?includeAll=1", { cache: "no-store" });
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = (await response.json()) as { clients?: ClientApi[] };
        const client = data.clients?.find((item) => item.id === clientId);
        if (client) {
          setInitialData(mapClientToInitial(client));
        }
      } finally {
        setLoading(false);
      }
    }

    if (!clientId) {
      setLoading(false);
      return;
    }

    void loadClient();
  }, [clientId]);

  async function handleSubmit(data: ClientData) {
    const response = await fetch(`/api/clients?id=${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(payload?.error || "La sauvegarde du client a echoue.");
      return;
    }

    router.push(`/dashboard/clients/${clientId}`);
  }

  if (loading) {
    return <p className="text-sm" style={{ color: "#64748B" }}>Chargement du client...</p>;
  }

  if (!initialData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Client introuvable.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-sm text-neutral-500" style={{ animation: "reveal-up 0.7s ease-out both" }}>
        <Link href="/dashboard/clients" className="hover:text-neutral-700 transition-colors">
          Clients
        </Link>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-neutral-900 font-medium">{heading}</span>
      </nav>

      <div style={{ animation: "reveal-up 0.7s ease-out both", animationDelay: "120ms" }}>
        <ClientForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/dashboard/clients/${clientId}`)}
        />
      </div>
    </div>
  );
}
