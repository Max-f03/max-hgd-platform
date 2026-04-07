"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ImageUploader, { type UploadImageItem } from "@/components/dashboard/ImageUploader";
import TagsInput from "@/components/dashboard/TagsInput";
import RichContentEditor, { type ContentBlock } from "@/components/dashboard/RichContentEditor";
import DatePicker from "@/components/dashboard/DatePicker";

export type ProjectStatus = "draft" | "published" | "completed" | "archived";
export type WorkflowMode = "template" | "empty" | "duplicate";
export type WorkflowTemplate = "site-web" | "branding" | "app-mobile" | "design-ui";

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
  projectType: string;
  workflowMode: WorkflowMode;
  workflowTemplate: WorkflowTemplate;
  duplicateFromProjectId: string;
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
  projectType?: string;
  clientId?: string;
  workflowMode?: string;
  duplicateFromProjectId?: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
}

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const PROJECT_FORM_STEPS = [
  { id: 1, label: "Infos" },
  { id: 2, label: "Contenu" },
  { id: 3, label: "Medias" },
  { id: 4, label: "Publication" },
] as const;

const PROJECT_TYPE_OPTIONS = [
  { value: "web-site", label: "Site web", category: "frontend" },
  { value: "branding", label: "Branding", category: "branding" },
  { value: "app-mobile", label: "App mobile", category: "frontend" },
  { value: "design-ui", label: "Design UI", category: "ux-ui" },
];

const WORKFLOW_MODE_OPTIONS = [
  { value: "template", label: "Template automatique", description: "Genere des colonnes et des taches" },
  { value: "empty", label: "Kanban vide", description: "Colonnes pretes, aucune tache" },
  { value: "duplicate", label: "Dupliquer un projet", description: "Copie le board d'un projet existant" },
] as const;

const WORKFLOW_TEMPLATE_OPTIONS = [
  { value: "site-web", label: "Site web" },
  { value: "branding", label: "Branding" },
  { value: "app-mobile", label: "App mobile" },
  { value: "design-ui", label: "Design UI" },
] as const;

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

function getDefaultTemplateForProjectType(projectType: string): WorkflowTemplate {
  const match = WORKFLOW_TEMPLATE_OPTIONS.find((item) => item.value === projectType);
  return (match?.value ?? "site-web") as WorkflowTemplate;
}

function getCategoryForProjectType(projectType: string): string {
  return PROJECT_TYPE_OPTIONS.find((item) => item.value === projectType)?.category ?? "other";
}

function createInitialForm(initialData?: Partial<ProjectFormData>): ProjectFormData {
  const initialProjectType = initialData?.projectType ?? "web-site";
  return {
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    shortDescription: initialData?.shortDescription ?? "",
    category: initialData?.category ?? getCategoryForProjectType(initialProjectType),
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
    projectType: initialProjectType,
    workflowMode: initialData?.workflowMode ?? "template",
    workflowTemplate: initialData?.workflowTemplate ?? "site-web",
    duplicateFromProjectId: initialData?.duplicateFromProjectId ?? "",
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
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [projects, setProjects] = useState<Array<{ value: string; label: string }>>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [duplicateSearch, setDuplicateSearch] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [duplicateDropdownOpen, setDuplicateDropdownOpen] = useState(false);
  const [newlyCreatedClientId, setNewlyCreatedClientId] = useState("");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialData?.slug));
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [showPreview, setShowPreview] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autosaveInfo, setAutosaveInfo] = useState("Auto-save inactif");
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const clientComboboxRef = useRef<HTMLDivElement>(null);
  const duplicateComboboxRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(() => `project-form-autosave-${formKey}`, [formKey]);

  async function loadClients() {
    try {
      const response = await fetch("/api/clients?includeAll=1", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        clients?: Array<{ id: string; name: string; email: string }>;
      };
      if (!data.clients) return;
      setClients(data.clients);
    } catch {
      // Keep current client cache when API is unavailable.
    }
  }

  async function loadProjects() {
    try {
      setLoadingProjects(true);
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { projects?: Array<{ id: string; title: string }> };
      if (!data.projects) return;
      const uniqueProjects = Array.from(
        new Map(data.projects.map((project) => [project.id, project])).values()
      );
      setProjects(uniqueProjects.map((project) => ({ value: project.id, label: project.title })));
    } catch {
      // Keep duplicate selector cache when API is unavailable.
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    void loadClients();
    void loadProjects();
  }, []);

  useEffect(() => {
    const selectedClient = clients.find((client) => client.id === form.clientId);
    if (selectedClient) {
      setClientSearch(selectedClient.name);
    }
  }, [clients, form.clientId]);

  useEffect(() => {
    const selectedProject = projects.find((project) => project.value === form.duplicateFromProjectId);
    if (selectedProject) {
      setDuplicateSearch(selectedProject.label);
    }
  }, [projects, form.duplicateFromProjectId]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        clientComboboxRef.current &&
        !clientComboboxRef.current.contains(event.target as Node)
      ) {
        setClientDropdownOpen(false);
      }

      if (
        duplicateComboboxRef.current &&
        !duplicateComboboxRef.current.contains(event.target as Node)
      ) {
        setDuplicateDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!duplicateDropdownOpen || form.workflowMode !== "duplicate") return;

    const timer = window.setInterval(() => {
      void loadProjects();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [duplicateDropdownOpen, form.workflowMode]);

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
    if (!isDirty) return;

    setAutosaveStatus("saving");
    setAutosaveInfo("Saving...");

    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(form));
        const now = new Date();
        setAutosaveStatus("saved");
        setAutosaveInfo(`Saved ${now.toLocaleTimeString("fr-FR")}`);
      } catch {
        setAutosaveStatus("error");
        setAutosaveInfo("Save failed");
      }
    }, 800);

    return () => window.clearTimeout(timer);
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

  function onProjectTypeChange(projectType: string) {
    const category = getCategoryForProjectType(projectType);
    patchForm("projectType", projectType);
    patchForm("category", category);

    if (form.workflowMode === "template") {
      patchForm("workflowTemplate", getDefaultTemplateForProjectType(projectType));
    }
  }

  function onWorkflowModeChange(mode: WorkflowMode) {
    patchForm("workflowMode", mode);
    if (mode !== "duplicate") {
      patchForm("duplicateFromProjectId", "");
      setDuplicateSearch("");
    }
    if (mode === "duplicate") {
      void loadProjects();
    }
    if (mode === "template" && !form.workflowTemplate) {
      patchForm("workflowTemplate", getDefaultTemplateForProjectType(form.projectType));
    }
  }

  async function createClientInline() {
    const name = newClientName.trim();
    const email = newClientEmail.trim();
    if (!name || !email) return;

    setCreatingClient(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, status: "lead" }),
      });

      const payload = (await response.json()) as {
        error?: string;
        client?: { id: string; name: string; email: string };
      };

      if (!response.ok || !payload.client) {
        setErrors((prev) => ({ ...prev, clientId: payload.error ?? "Creation client impossible." }));
        return;
      }

      const nextClient = payload.client;
      setClients((prev) => [nextClient, ...prev]);
      patchForm("clientId", nextClient.id);
      setClientSearch(nextClient.name);
      setClientDropdownOpen(false);
      setNewlyCreatedClientId(nextClient.id);
      setNewClientName("");
      setNewClientEmail("");
      setErrors((prev) => ({ ...prev, clientId: undefined }));
    } catch {
      setErrors((prev) => ({ ...prev, clientId: "Creation client impossible." }));
    } finally {
      setCreatingClient(false);
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

    if (!form.projectType) {
      nextErrors.projectType = "Le type de projet est requis.";
    }

    if (!form.workflowMode) {
      nextErrors.workflowMode = "Le workflow est requis.";
    }

    if (form.workflowMode === "duplicate" && !form.duplicateFromProjectId) {
      nextErrors.duplicateFromProjectId = "Selectionnez un projet a dupliquer.";
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
      setAutosaveStatus("saved");
      setAutosaveInfo("Formulaire enregistre");
    } finally {
      setIsSubmitting(false);
    }
  }

  const completionChecks = useMemo(
    () => [
      form.title.trim().length >= 3,
      form.shortDescription.trim().length > 0,
      Boolean(form.projectType),
      Boolean(form.workflowMode),
      form.workflowMode === "duplicate" ? Boolean(form.duplicateFromProjectId) : true,
      Boolean(form.clientId),
      Boolean(form.coverImage),
      form.technologies.length > 0,
      form.contentBlocks.length > 0,
      Boolean(form.publicationDate),
    ],
    [form]
  );

  const completionPercent = useMemo(() => {
    const done = completionChecks.filter(Boolean).length;
    return Math.round((done / completionChecks.length) * 100);
  }, [completionChecks]);

  const autosaveToneClass =
    autosaveStatus === "saving"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : autosaveStatus === "saved"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : autosaveStatus === "error"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-slate-50 text-slate-600 border-slate-200";

  function goToStep(step: 1 | 2 | 3 | 4) {
    setCurrentStep(step);
  }

  const figmaEmbedUrl = useMemo(() => {
    if (!form.figmaUrl) return "";
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(form.figmaUrl)}`;
  }, [form.figmaUrl]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients.slice(0, 8);
    return clients
      .filter((client) => client.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clientSearch, clients]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === form.clientId) ?? null,
    [clients, form.clientId]
  );

  const duplicateProjectsFiltered = useMemo(() => {
    const q = duplicateSearch.trim().toLowerCase();
    const pool = projects;
    if (!q) return pool.slice(0, 8);
    return pool.filter((project) => project.label.toLowerCase().includes(q)).slice(0, 8);
  }, [duplicateSearch, projects]);

  return (
    <div className="mx-auto w-full max-w-[1040px] flex flex-col gap-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">Creation projet</p>
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              {showPreview ? "Masquer preview" : "Apercu rapide"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROJECT_FORM_STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={[
                  "rounded-xl border px-3 py-2 text-left transition-colors",
                  currentStep === step.id
                    ? "border-blue-200 bg-blue-50"
                    : "border-neutral-200 bg-white hover:border-blue-100",
                ].join(" ")}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Etape {step.id}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{step.label}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Progression du formulaire</span>
              <span className="font-semibold text-slate-900">{completionPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={["rounded-full border px-2.5 py-1 text-xs font-semibold", autosaveToneClass].join(" ")}>
              {autosaveInfo}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => goToStep((Math.max(1, currentStep - 1) as 1 | 2 | 3 | 4))}
                disabled={currentStep === 1}
              >
                Precedent
              </Button>
              <Button
                variant="outline"
                size="xs"
                type="button"
                onClick={() => goToStep((Math.min(4, currentStep + 1) as 1 | 2 | 3 | 4))}
                disabled={currentStep === 4}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {showPreview ? (
        <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Preview</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{form.title || "Titre du projet"}</h3>
          <p className="mt-2 text-sm text-slate-600">{form.shortDescription || "La description apparaitra ici."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.technologies.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {tag}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {currentStep === 1 ? (
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
          <Select
            label="Type de projet *"
            value={form.projectType}
            onChange={(value) => onProjectTypeChange(value)}
            options={PROJECT_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            error={errors.projectType}
          />
          <div className="flex flex-col gap-2" ref={clientComboboxRef}>
            <label className="text-xs text-[var(--ui-text-secondary)]">Client associe</label>
            <input
              value={clientSearch}
              onFocus={() => setClientDropdownOpen(true)}
              onChange={(event) => {
                const value = event.target.value;
                setClientSearch(value);
                const match = clients.find((client) => client.name.toLowerCase() === value.trim().toLowerCase());
                patchForm("clientId", match?.id ?? "");
                setClientDropdownOpen(true);
              }}
              placeholder="Rechercher un client..."
              className="h-11 rounded-xl border px-3 text-sm outline-none"
              style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)", color: "var(--ui-text)" }}
            />

            {clientDropdownOpen ? (
              <div className="rounded-xl border" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
                <button
                  type="button"
                  onClick={() => {
                    patchForm("clientId", "");
                    setClientSearch("");
                    setClientDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                  style={{ color: "var(--ui-text-secondary)" }}
                >
                  Aucun
                </button>
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      patchForm("clientId", client.id);
                      setClientSearch(client.name);
                      setClientDropdownOpen(false);
                    }}
                    className="w-full border-t px-3 py-2 text-left text-sm hover:bg-blue-50"
                    style={{ borderColor: "var(--ui-border-subtle)", color: "var(--ui-text)" }}
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            ) : null}

            {selectedClient && selectedClient.id === newlyCreatedClientId ? (
              <span className="inline-flex self-start rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                Nouveau client ajoute
              </span>
            ) : null}

            {!selectedClient && clientSearch.trim().length >= 2 ? (
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--ui-border)", background: "var(--d-input)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--ui-text-secondary)" }}>
                  Client introuvable, creer maintenant
                </p>
                <input
                  value={newClientName}
                  onChange={(event) => setNewClientName(event.target.value)}
                  placeholder="Nom du client"
                  className="mt-2 h-9 w-full rounded-lg border px-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)", color: "var(--ui-text)" }}
                />
                <input
                  value={newClientEmail}
                  onChange={(event) => setNewClientEmail(event.target.value)}
                  placeholder="Email du client"
                  className="mt-2 h-9 w-full rounded-lg border px-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)", color: "var(--ui-text)" }}
                />
                <button
                  type="button"
                  onClick={() => void createClientInline()}
                  disabled={creatingClient}
                  className="mt-2 inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: "var(--ui-primary)" }}
                >
                  {creatingClient ? "Creation..." : "Creer le client"}
                </button>
              </div>
            ) : null}

            {errors.clientId ? <p className="text-xs text-red-600">{errors.clientId}</p> : null}
          </div>
        </div>

        <Card className="border border-blue-100 bg-blue-50/40 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Workflow Kanban</p>
              <p className="mt-1 text-sm text-slate-700">Choisissez comment le board sera genere apres creation du projet.</p>
            </div>
            <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Step cle
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {WORKFLOW_MODE_OPTIONS.map((option) => {
              const active = form.workflowMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onWorkflowModeChange(option.value)}
                  className={[
                    "rounded-xl border px-3 py-2 text-left transition",
                    active ? "border-blue-300 bg-white" : "border-blue-100 bg-white/80 hover:border-blue-200",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-600">{option.description}</p>
                </button>
              );
            })}
          </div>

          {errors.workflowMode ? <p className="mt-2 text-xs text-red-600">{errors.workflowMode}</p> : null}

          {form.workflowMode === "template" ? (
            <div className="mt-3">
              <Select
                label="Template de workflow"
                value={form.workflowTemplate}
                onChange={(value) => patchForm("workflowTemplate", value as WorkflowTemplate)}
                options={WORKFLOW_TEMPLATE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
            </div>
          ) : null}

          {form.workflowMode === "duplicate" ? (
            <div className="mt-3">
              <label className="text-xs text-[var(--ui-text-secondary)]">Projet a dupliquer</label>
              <div className="mt-1 flex items-center gap-2" ref={duplicateComboboxRef}>
                <input
                  value={duplicateSearch}
                  onFocus={() => {
                    setDuplicateDropdownOpen(true);
                    void loadProjects();
                  }}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDuplicateSearch(value);
                    const match = projects.find((project) => project.label.toLowerCase() === value.trim().toLowerCase());
                    patchForm("duplicateFromProjectId", match?.value ?? "");
                    setDuplicateDropdownOpen(true);
                  }}
                  placeholder="Rechercher un projet..."
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
                  style={{ borderColor: "var(--ui-border)", background: "var(--ui-input-bg)", color: "var(--ui-text)" }}
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: "var(--ui-text-muted)" }}>
                {loadingProjects
                  ? "Mise a jour de la liste..."
                  : "Liste mise a jour automatiquement toutes les 5s tant que le menu est ouvert."}
              </p>

              {duplicateDropdownOpen ? (
                <div className="mt-2 rounded-xl border" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
                  {duplicateProjectsFiltered.length === 0 ? (
                    <p className="px-3 py-2 text-xs" style={{ color: "var(--ui-text-muted)" }}>
                      Aucun projet correspondant.
                    </p>
                  ) : (
                    duplicateProjectsFiltered.map((project) => (
                      <button
                        key={project.value}
                        type="button"
                        onClick={() => {
                          patchForm("duplicateFromProjectId", project.value);
                          setDuplicateSearch(project.label);
                          setDuplicateDropdownOpen(false);
                        }}
                        className="w-full border-t px-3 py-2 text-left text-sm first:border-t-0 hover:bg-blue-50"
                        style={{ borderColor: "var(--ui-border-subtle)", color: "var(--ui-text)" }}
                      >
                        {project.label}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
              {errors.duplicateFromProjectId ? <p className="mt-1 text-xs text-red-600">{errors.duplicateFromProjectId}</p> : null}
            </div>
          ) : null}
        </Card>

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
      ) : null}

      {currentStep === 3 ? (
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
      ) : null}

      {currentStep === 2 ? (
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
      ) : null}

      {currentStep === 2 ? (
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
      ) : null}

      {currentStep === 2 ? (
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
      ) : null}

      {currentStep === 2 ? (
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
      ) : null}

      {currentStep === 4 ? (
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
      ) : null}

      {currentStep === 4 ? (
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
      ) : null}

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
