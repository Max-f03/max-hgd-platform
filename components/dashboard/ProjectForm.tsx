"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ImageUploader, { type UploadImageItem } from "@/components/dashboard/ImageUploader";
import TagsInput from "@/components/dashboard/TagsInput";
import RichContentEditor, { type ContentBlock } from "@/components/dashboard/RichContentEditor";
import DatePicker from "@/components/dashboard/DatePicker";
import Link from "next/link";

export type ProjectStatus = "draft" | "published" | "completed" | "archived";

export interface ProjectFormData {
  title: string;
  slug: string;
  shortDescription: string;
  category: string;
  clientId: string;
  status: ProjectStatus;
  featured: boolean;
  coverImage: UploadImageItem | null;
  galleryImages: UploadImageItem[];
  videoUrl: string;
  figmaUrl: string;
  technologies: string[];
  contentBlocks: ContentBlock[];
  liveSiteUrl: string;
  githubUrl: string;
  dribbbleBehanceUrl: string;
  testimonialText: string;
  testimonialClientName: string;
  testimonialRoleCompany: string;
  testimonialPhoto: UploadImageItem | null;
  seoTitle: string;
  seoDescription: string;
  openGraphImage: UploadImageItem | null;
  publicationDate: string;
  displayOrder: number;
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  formKey?: string;
  onSubmit: (data: ProjectFormData, action: "draft" | "publish") => void | Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  title?: string;
  shortDescription?: string;
  category?: string;
  clientId?: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
}

const CATEGORY_OPTIONS = [
  { value: "ux-ui", label: "UX/UI Design" },
  { value: "frontend", label: "Frontend Development" },
  { value: "branding", label: "Branding" },
  { value: "other", label: "Autre" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publie" },
  { value: "completed", label: "Termine" },
  { value: "archived", label: "Archive" },
];

const TECH_SUGGESTIONS = [
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind",
  "Node.js",
  "MongoDB",
  "Prisma",
  "GraphQL",
  "Figma",
  "Vercel",
  "Docker",
  "Storybook",
  "Stripe",
  "PostgreSQL",
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createInitialForm(initialData?: Partial<ProjectFormData>): ProjectFormData {
  return {
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    shortDescription: initialData?.shortDescription ?? "",
    category: initialData?.category ?? "",
    clientId: initialData?.clientId ?? "",
    status: initialData?.status ?? "draft",
    featured: initialData?.featured ?? false,
    coverImage: initialData?.coverImage ?? null,
    galleryImages: initialData?.galleryImages ?? [],
    videoUrl: initialData?.videoUrl ?? "",
    figmaUrl: initialData?.figmaUrl ?? "",
    technologies: initialData?.technologies ?? [],
    contentBlocks: initialData?.contentBlocks ?? [],
    liveSiteUrl: initialData?.liveSiteUrl ?? "",
    githubUrl: initialData?.githubUrl ?? "",
    dribbbleBehanceUrl: initialData?.dribbbleBehanceUrl ?? "",
    testimonialText: initialData?.testimonialText ?? "",
    testimonialClientName: initialData?.testimonialClientName ?? "",
    testimonialRoleCompany: initialData?.testimonialRoleCompany ?? "",
    testimonialPhoto: initialData?.testimonialPhoto ?? null,
    seoTitle: initialData?.seoTitle ?? "",
    seoDescription: initialData?.seoDescription ?? "",
    openGraphImage: initialData?.openGraphImage ?? null,
    publicationDate: initialData?.publicationDate ?? "",
    displayOrder: initialData?.displayOrder ?? 0,
  };
}

function Section({
  title,
  index,
  icon,
  children,
}: {
  title: string;
  index: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: "#1D4ED8" }}
        >
          {index}
        </span>
        {icon ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            {icon}
          </span>
        ) : null}
        <h3 className="text-sm font-semibold" style={{ color: "#0F172A" }}>{title}</h3>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </Card>
  );
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children}
      <span style={{ color: "#DC2626" }}> *</span>
    </span>
  );
}

export default function ProjectForm({ initialData, formKey = "new", onSubmit, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>(() => createInitialForm(initialData));
  const [errors, setErrors] = useState<FormErrors>({});
  const [clients, setClients] = useState<Array<{ value: string; label: string }>>([{ value: "", label: "Aucun" }]);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialData?.slug));
  const [seoOpen, setSeoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autosaveInfo, setAutosaveInfo] = useState("Auto-save inactif");
  const [isDirty, setIsDirty] = useState(false);

  const storageKey = useMemo(() => `project-form-autosave-${formKey}`, [formKey]);

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch("/api/clients?includeAll=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { clients?: Array<{ id: string; name: string }> };
        if (!data.clients) return;
        const options = data.clients.map((client) => ({ value: client.id, label: client.name }));
        setClients([{ value: "", label: "Aucun" }, ...options]);
      } catch {
        // Keep default empty option when API is unavailable.
      }
    }
    void loadClients();
  }, []);

  useEffect(() => {
    if (initialData) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ProjectFormData;
      setForm((current) => ({ ...current, ...parsed }));
      setAutosaveInfo("Brouillon restaure depuis l'auto-save");
    } catch {
      // Ignore malformed autosave payload.
    }
  }, [initialData, storageKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!isDirty) return;
      localStorage.setItem(storageKey, JSON.stringify(form));
      const now = new Date();
      setAutosaveInfo(`Auto-save: ${now.toLocaleTimeString("fr-FR")}`);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [form, isDirty, storageKey]);

  function patchForm<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function onTitleChange(title: string) {
    patchForm("title", title);
    if (!slugEdited) {
      patchForm("slug", slugify(title));
    }
  }

  function validate(action: "draft" | "publish"): boolean {
    const nextErrors: FormErrors = {};

    if (form.title.trim().length < 3) {
      nextErrors.title = "Le titre doit contenir au moins 3 caracteres.";
    }

    if (!form.shortDescription.trim()) {
      nextErrors.shortDescription = "La description courte est requise.";
    } else if (form.shortDescription.length > 200) {
      nextErrors.shortDescription = "Maximum 200 caracteres.";
    }

    if (!form.category) {
      nextErrors.category = "La categorie est requise.";
    }

    if (action === "publish" && !form.clientId) {
      nextErrors.clientId = "Un client doit etre selectionne avant publication.";
    }

    if (action === "publish" && !form.coverImage) {
      nextErrors.coverImage = "Une image de couverture est requise pour publier.";
    }

    if (form.seoTitle.length > 60) {
      nextErrors.seoTitle = "Maximum 60 caracteres.";
    }

    if (form.seoDescription.length > 160) {
      nextErrors.seoDescription = "Maximum 160 caracteres.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(action: "draft" | "publish") {
    if (!validate(action)) return;

    setIsSubmitting(true);
    const finalStatus: ProjectStatus = action === "publish" ? "published" : "draft";

    try {
      await onSubmit({ ...form, status: finalStatus }, action);
      setIsDirty(false);
      localStorage.removeItem(storageKey);
      setAutosaveInfo("Formulaire enregistre");
    } finally {
      setIsSubmitting(false);
    }
  }

  const figmaEmbedUrl = useMemo(() => {
    if (!form.figmaUrl) return "";
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(form.figmaUrl)}`;
  }, [form.figmaUrl]);

  return (
    <div className="mx-auto w-full max-w-[800px] flex flex-col gap-4">
      <Section
        title="Informations de base"
        index={1}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        }
      >
        <Input label="Titre *" value={form.title} onChange={(e) => onTitleChange(e.target.value)} error={errors.title} placeholder="Ex: Plateforme E-commerce" />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(e) => {
            setSlugEdited(true);
            patchForm("slug", slugify(e.target.value));
          }}
          placeholder="plateforme-ecommerce"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700"><RequiredLabel>Description courte</RequiredLabel></label>
          <textarea
            value={form.shortDescription}
            maxLength={200}
            rows={4}
            onChange={(event) => patchForm("shortDescription", event.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors duration-200 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            style={{ borderColor: errors.shortDescription ? "#F87171" : "#D4D4D8" }}
            placeholder="Resume court du projet..."
          />
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "#DC2626" }}>{errors.shortDescription}</p>
            <p className="text-xs" style={{ color: form.shortDescription.length > 180 ? "#D97706" : "#94A3B8" }}>{form.shortDescription.length}/200</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Categorie *" value={form.category} onChange={(value) => patchForm("category", value)} options={CATEGORY_OPTIONS} error={errors.category} />
          <div>
            <Select
              label="Client associe"
              value={form.clientId}
              onChange={(value) => patchForm("clientId", value)}
              options={clients}
              error={errors.clientId}
            />
            {clients.length <= 1 ? (
              <p className="mt-1 text-xs text-slate-500">
                Aucun client disponible. 
                <Link href="/dashboard/clients?create=1" className="font-semibold text-blue-700 hover:underline">
                  Creer un client
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Select label="Status" value={form.status} onChange={(value) => patchForm("status", value as ProjectStatus)} options={STATUS_OPTIONS} />
          <label className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Mettre en avant sur le portfolio</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Featured</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.featured}
              onClick={() => patchForm("featured", !form.featured)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              style={{ background: form.featured ? "#1D4ED8" : "#CBD5E1" }}
            >
              <span
                className="absolute h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200"
                style={{ transform: form.featured ? "translateX(20px)" : "translateX(2px)" }}
              />
            </button>
          </label>
        </div>
      </Section>

      <Section
        title="Medias"
        index={2}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        }
      >
        <ImageUploader
          label="Image de couverture"
          required
          value={form.coverImage}
          onChange={(image) => patchForm("coverImage", image)}
          error={errors.coverImage}
          aspectRatio="16/9"
        />

        <ImageUploader
          label="Galerie d'images"
          multiple
          items={form.galleryImages}
          onItemsChange={(items) => patchForm("galleryImages", items)}
          aspectRatio="4/3"
        />

        <Input label="Lien video (YouTube, Vimeo, Loom)" type="url" value={form.videoUrl} onChange={(e) => patchForm("videoUrl", e.target.value)} placeholder="https://..." />

        <Input label="Lien prototype Figma" type="url" value={form.figmaUrl} onChange={(e) => patchForm("figmaUrl", e.target.value)} placeholder="https://www.figma.com/..." />
        {figmaEmbedUrl ? (
          <div className="rounded-xl border border-neutral-200 overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <iframe src={figmaEmbedUrl} title="Preview Figma" className="w-full h-full" allowFullScreen />
          </div>
        ) : null}
      </Section>

      <Section
        title="Technologies et Tags"
        index={3}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.59 13.41L11 3.83V3H3v8h.83l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z" />
            <circle cx="7.5" cy="7.5" r="1.5" />
          </svg>
        }
      >
        <TagsInput
          label="Technologies utilisees"
          tags={form.technologies}
          suggestions={TECH_SUGGESTIONS}
          onChange={(tags) => patchForm("technologies", tags)}
          placeholder="React, Next.js, Figma..."
        />
      </Section>

      <Section
        title="Contenu riche (style Behance)"
        index={4}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M3 12h18" />
            <path d="M3 18h10" />
          </svg>
        }
      >
        <RichContentEditor blocks={form.contentBlocks} onChange={(blocks) => patchForm("contentBlocks", blocks)} />
      </Section>

      <Section
        title="Liens externes"
        index={5}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 5" />
            <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L14 19" />
          </svg>
        }
      >
        <Input label="Lien site live" type="url" value={form.liveSiteUrl} onChange={(e) => patchForm("liveSiteUrl", e.target.value)} placeholder="https://..." />
        <Input label="Lien GitHub" type="url" value={form.githubUrl} onChange={(e) => patchForm("githubUrl", e.target.value)} placeholder="https://github.com/..." />
        <Input label="Lien Dribbble/Behance" type="url" value={form.dribbbleBehanceUrl} onChange={(e) => patchForm("dribbbleBehanceUrl", e.target.value)} placeholder="https://dribbble.com/..." />
      </Section>

      <Section
        title="Testimonial client (optionnel)"
        index={6}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21c3 0 7-2 7-8V5H3v8h4" />
            <path d="M14 21c3 0 7-2 7-8V5h-7v8h4" />
          </svg>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Texte du temoignage</label>
          <textarea
            value={form.testimonialText}
            onChange={(event) => patchForm("testimonialText", event.target.value)}
            rows={4}
            className="w-full border rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none transition-colors duration-200 resize-none border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Temoignage du client..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nom du client" value={form.testimonialClientName} onChange={(e) => patchForm("testimonialClientName", e.target.value)} />
          <Input label="Poste / Entreprise" value={form.testimonialRoleCompany} onChange={(e) => patchForm("testimonialRoleCompany", e.target.value)} />
        </div>
        <div className="max-w-[220px]">
          <ImageUploader label="Photo client" value={form.testimonialPhoto} onChange={(image) => patchForm("testimonialPhoto", image)} aspectRatio="1/1" />
        </div>
      </Section>

      <Card className="p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setSeoOpen((value) => !value)}
          className="w-full px-5 py-4 border-b border-neutral-100 flex items-center justify-between"
          style={{ borderBottomWidth: seoOpen ? 1 : 0 }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "#1D4ED8" }}>7</span>
            <h3 className="text-sm font-semibold" style={{ color: "#0F172A" }}>SEO</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#64748B" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {seoOpen ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
            </svg>
            {seoOpen ? "Fermer" : "Ouvrir"}
          </span>
        </button>

        {seoOpen ? (
          <div className="p-5 sm:p-6 flex flex-col gap-4">
            <Input label="Meta title" value={form.seoTitle} onChange={(e) => patchForm("seoTitle", e.target.value)} error={errors.seoTitle} placeholder="Maximum 60 caracteres" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">Meta description</label>
              <textarea
                value={form.seoDescription}
                maxLength={160}
                rows={3}
                onChange={(event) => patchForm("seoDescription", event.target.value)}
                className="w-full border rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none transition-colors duration-200 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                style={{ borderColor: errors.seoDescription ? "#F87171" : "#D4D4D8" }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "#DC2626" }}>{errors.seoDescription}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{form.seoDescription.length}/160</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
              <p className="text-sm" style={{ color: "#334155" }}>Utiliser l&apos;image de couverture pour Open Graph</p>
              <button
                type="button"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md"
                style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                onClick={() => patchForm("openGraphImage", form.coverImage)}
              >
                Utiliser couverture
              </button>
            </div>

            <ImageUploader label="Image Open Graph" value={form.openGraphImage} onChange={(image) => patchForm("openGraphImage", image)} aspectRatio="16/9" />
          </div>
        ) : null}
      </Card>

      <Section
        title="Options de publication"
        index={8}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 1v22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Date de publication"
            value={form.publicationDate}
            onChange={(value) => patchForm("publicationDate", value)}
          />
          <Input
            label="Ordre d'affichage"
            type="number"
            value={String(form.displayOrder)}
            onChange={(e) => patchForm("displayOrder", Number(e.target.value || 0))}
          />
        </div>
      </Section>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs" style={{ color: "#64748B" }}>{autosaveInfo}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>Annuler</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void submit("draft")}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                <path d="M19 21H5a2 2 0 0 1-2-2V7l5-4h8l5 4v12a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Sauvegarder brouillon
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void submit("publish")}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
              Publier
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
