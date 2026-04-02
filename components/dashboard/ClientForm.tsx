"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export interface ClientData {
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "lead" | "active" | "completed";
  notes: string;
}

interface ClientFormProps {
  initialData?: Partial<ClientData>;
  onSubmit: (data: ClientData) => void | Promise<void>;
  onCancel: () => void;
}

const statusOptions = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Actif" },
  { value: "completed", label: "Complete" },
];

export default function ClientForm({
  initialData,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState<ClientData>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    company: initialData?.company ?? "",
    phone: initialData?.phone ?? "",
    status: initialData?.status ?? "lead",
    notes: initialData?.notes ?? "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function handleChange(field: keyof ClientData, value: string) {
    if (submitError) setSubmitError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field: keyof ClientData) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const nameError = form.name.trim().length < 2 ? "Le nom doit contenir au moins 2 caracteres" : "";
  const emailError =
    form.email.trim() === ""
      ? "L'email est obligatoire"
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? ""
      : "Format d'email invalide";
  const statusError = form.status ? "" : "Selectionnez un statut";

  const canSubmit = !nameError && !emailError && !statusError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setTouched({ name: true, email: true, status: true, company: true, phone: true, notes: true });
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await Promise.resolve(onSubmit(form));
    } catch {
      setSubmitError("Impossible de sauvegarder ce client. Reessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-700">Informations principales</p>
        <p className="mt-1 text-xs text-slate-500">Les champs marques * sont obligatoires.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Nom complet *"
          placeholder="Prenom Nom"
          value={form.name}
          error={touched.name ? nameError : ""}
          onBlur={() => markTouched("name")}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <Input
          label="Email *"
          type="email"
          placeholder="email@exemple.com"
          value={form.email}
          error={touched.email ? emailError : ""}
          onBlur={() => markTouched("email")}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Entreprise"
          placeholder="Nom de l'entreprise"
          value={form.company}
          onBlur={() => markTouched("company")}
          onChange={(e) => handleChange("company", e.target.value)}
        />
        <Input
          label="Telephone"
          type="tel"
          placeholder="+33 6 00 00 00 00"
          value={form.phone}
          onBlur={() => markTouched("phone")}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      <Select
        label="Statut *"
        options={statusOptions}
        value={form.status}
        error={touched.status ? statusError : ""}
        onChange={(v) => handleChange("status", v)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">Notes</label>
        <textarea
          value={form.notes}
          onBlur={() => markTouched("notes")}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Notes internes sur ce client..."
          rows={4}
          className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 resize-none"
        />
        <p className="text-xs text-slate-500">Optionnel: contexte, priorites ou contraintes du client.</p>
      </div>

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{submitError}</div>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 border-t border-neutral-200 bg-white px-1 pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel} type="button" disabled={isSubmitting}>
          Annuler
        </Button>
        <div className="flex-1" />
        <Button variant="primary" size="sm" type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </form>
  );
}
