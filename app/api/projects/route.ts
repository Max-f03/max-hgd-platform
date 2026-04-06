import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createDefaultPipelineForProject } from "@/lib/project-pipeline";

type ProjectStatus = "published" | "draft" | "archived" | "completed";

interface UploadImageItem {
  id: string;
  url: string;
  name: string;
}

interface ProjectFormPayload {
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
  contentBlocks: unknown[];
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
  workflowMode: "template" | "empty" | "duplicate";
  workflowTemplate: string;
  duplicateFromProjectId: string;
}

const categoryLabelMap: Record<string, string> = {
  "ux-ui": "UX/UI Design",
  frontend: "Frontend Dev",
  branding: "Branding",
  "mobile-app": "App mobile",
  "web-site": "Site web",
  other: "Autre",
};

const projectTypeToCategoryMap: Record<string, string> = {
  "web-site": "frontend",
  branding: "branding",
  "mobile-app": "frontend",
  "design-ui": "ux-ui",
};

function resolveCategory(projectType?: string, incomingCategory?: string): string {
  if (incomingCategory) return incomingCategory;
  if (projectType && projectTypeToCategoryMap[projectType]) {
    return projectTypeToCategoryMap[projectType];
  }
  return "other";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const parts = value.split(/[\/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const fallback = new Date(`${y}-${m}-${d}`);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return undefined;
}

function getFirstMediaUrl(item: UploadImageItem | null | undefined): string | null {
  return item?.url ?? null;
}

async function resolveActorUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const fallbackUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!fallbackUser) {
    throw new Error("Aucun utilisateur disponible pour creer le projet.");
  }

  return fallbackUser.id;
}

function mapProjectToDashboard(project: {
  id: string;
  title: string;
  category: string;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
}) {
  const dateSource = project.publishedAt ?? project.createdAt;
  return {
    id: project.id,
    title: project.title,
    category: project.category,
    categoryLabel: categoryLabelMap[project.category] ?? "Autre",
    status: (project.status as ProjectStatus) ?? "draft",
    date: dateSource.toLocaleDateString("fr-FR"),
    featured: project.featured,
  };
}

function mapProjectToPublic(project: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  colors: string[];
  featured: boolean;
}) {
  const start = project.colors[0] ?? "#43a7e8";
  const end = project.colors[1] ?? "#19d2dc";
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description ?? "",
    category: categoryLabelMap[project.category] ?? "Autre",
    tag: project.tags[0] ?? "Projet",
    tagColor: "#1E40AF",
    gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
    categoryColor: project.category === "frontend" ? "text-accent-500" : "text-primary-500",
    featured: project.featured,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const slug = searchParams.get("slug");

    if (slug) {
      const project = await prisma.project.findUnique({
        where: { slug },
      });

      if (!project) {
        return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
      }

      return NextResponse.json({ project });
    }

    if (scope === "public") {
      const projects = await prisma.project.findMany({
        where: { status: "published" },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      });

      return NextResponse.json({
        projects: projects.map((project) =>
          mapProjectToPublic({
            id: project.id,
            slug: project.slug,
            title: project.title,
            description: project.description,
            category: project.category,
            tags: project.tags,
            colors: project.colors,
            featured: project.featured,
          })
        ),
      });
    }

    const session = await auth();
    const projects = await prisma.project.findMany({
      where: session?.user?.id ? { userId: session.user.id } : undefined,
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({
      projects: projects.map((project) =>
        mapProjectToDashboard({
          id: project.id,
          title: project.title,
          category: project.category,
          status: project.status,
          featured: project.featured,
          publishedAt: project.publishedAt,
          createdAt: project.createdAt,
        })
      ),
    });
  } catch {
    return NextResponse.json({ error: "Impossible de charger les projets." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      data?: Partial<ProjectFormPayload>;
      title?: string;
      slug?: string;
      shortDescription?: string;
      category?: string;
      categoryLabel?: string;
      status?: ProjectStatus;
      date?: string;
      featured?: boolean;
      makeFromSummary?: boolean;
      projectType?: string;
      workflow?: {
        mode?: "template" | "empty" | "duplicate";
        templateKey?: string;
        duplicateProjectId?: string;
      };
    };

    const payload = (body.data ?? body) as Partial<ProjectFormPayload>;
    if (!payload.title?.trim()) {
      return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
    }

    const userId = await resolveActorUserId();
    const nextSlug = slugify(payload.slug?.trim() || payload.title);
    const publicationDate = parseDateInput(payload.publicationDate ?? body.date ?? "") ?? new Date();

    const nextStatus = payload.status ?? body.status ?? "draft";
    const projectType = payload.projectType?.trim() || body.projectType?.trim() || "";
    const resolvedCategory = resolveCategory(projectType, payload.category ?? body.category);
    const incomingClientId = payload.clientId?.trim() || null;

    if (nextStatus === "published" && !incomingClientId) {
      return NextResponse.json(
        { error: "Un client est requis avant publication." },
        { status: 400 }
      );
    }

    const linkedClient = incomingClientId
      ? await prisma.client.findFirst({
          where: { id: incomingClientId, userId },
          select: { name: true, avatar: true },
        })
      : null;

    if (incomingClientId && !linkedClient && nextStatus === "published") {
      return NextResponse.json(
        { error: "Client introuvable pour cet utilisateur." },
        { status: 400 }
      );
    }

    // Ignore stale or invalid client IDs for drafts (e.g. old mock ids from URL).
    const clientId = linkedClient ? incomingClientId : null;
    const rawTags = payload.technologies?.length ? payload.technologies : [resolvedCategory];
    const workflowMode = body.workflow?.mode ?? payload.workflowMode ?? "template";
    const workflowTemplate = body.workflow?.templateKey ?? payload.workflowTemplate ?? "site-web";
    const workflowTags = [
      projectType ? `project-type:${projectType}` : "",
      workflowMode ? `workflow:${workflowMode}` : "",
      workflowTemplate ? `workflow-template:${workflowTemplate}` : "",
    ].filter(Boolean);
    const tags = Array.from(new Set([...rawTags, ...workflowTags]));

    const createData = {
      title: payload.title,
      slug: nextSlug,
      description: payload.shortDescription ?? body.shortDescription ?? "",
      content: payload.contentBlocks ? (JSON.parse(JSON.stringify({ blocks: payload.contentBlocks })) as object) : undefined,
      thumbnail: getFirstMediaUrl(payload.coverImage),
      images: (payload.galleryImages ?? []).map((item) => item.url),
      videoUrl: payload.videoUrl || null,
      category: resolvedCategory,
      tags,
      technologies: payload.technologies ?? [],
      colors: ["#43a7e8", "#19d2dc"],
      liveUrl: payload.liveSiteUrl || null,
      githubUrl: payload.githubUrl || null,
      figmaUrl: payload.figmaUrl || null,
      clientName: linkedClient?.name ?? null,
      clientLogo: linkedClient?.avatar ?? null,
      testimonial:
        payload.testimonialText || payload.testimonialClientName
          ? {
              text: payload.testimonialText ?? "",
              clientName: payload.testimonialClientName ?? "",
              roleCompany: payload.testimonialRoleCompany ?? "",
              photoUrl: getFirstMediaUrl(payload.testimonialPhoto),
            }
          : undefined,
      seo:
        payload.seoTitle || payload.seoDescription
          ? {
              title: payload.seoTitle ?? "",
              description: payload.seoDescription ?? "",
              openGraphImage: getFirstMediaUrl(payload.openGraphImage),
            }
          : undefined,
      status: nextStatus,
      featured: Boolean(payload.featured ?? body.featured ?? false),
      order: payload.displayOrder ?? 0,
      publishedAt: nextStatus === "published" ? publicationDate : null,
      userId,
    };

    if (body.id) {
      const updated = await prisma.project.update({
        where: { id: body.id },
        data: createData,
      });
      return NextResponse.json({ project: updated }, { status: 200 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({ data: createData });
      const generatedWorkflow = await createDefaultPipelineForProject(tx, {
        projectId: project.id,
        userId,
        baselineDate: publicationDate,
        workflow: {
          mode: workflowMode,
          templateKey: workflowTemplate,
          duplicateProjectId:
            body.workflow?.duplicateProjectId ?? payload.duplicateFromProjectId,
        },
      });
      return { project, generatedWorkflow };
    });

    return NextResponse.json(
      {
        project: created.project,
        workflow: created.generatedWorkflow,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requete invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Parametre id manquant." }, { status: 400 });
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }
}
