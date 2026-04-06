import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
  createDefaultPipelineForProject,
  syncProjectStatusFromPipeline,
} from "@/lib/project-pipeline"

const db = prisma as unknown as {
  projectStage?: {
    findMany: (args: {
      where: { projectId: string; userId: string }
      orderBy: { position: "asc" }
      include: {
        tasks: {
          orderBy: Array<{ position: "asc" } | { createdAt: "asc" }>
          include: { deliverable: true; attachments: true }
        }
      }
    }) => Promise<unknown[]>
  }
}

const STAGE_STATUS_MAP: Record<string, string> = {
  backlog: "todo",
  todo: "todo",
  in_progress: "in_progress",
  review: "review",
  testing: "review",
  client_review: "review",
  validated: "done",
  done: "done",
}

type KanbanTx = {
  projectTask: {
    findFirst: (args: Record<string, unknown>) => Promise<
      | {
          id?: string
          title?: string
          type?: string
          startedAt?: Date | null
          stage?: { key?: string }
          position?: number
        }
      | null
    >
    update: (args: Record<string, unknown>) => Promise<{ id: string; type: string; title: string }>
  }
  projectStage: {
    findFirst: (args: Record<string, unknown>) => Promise<{ id: string; key: string } | null>
  }
  projectTaskTransition: {
    create: (args: Record<string, unknown>) => Promise<unknown>
  }
  timeEntry: {
    create: (args: Record<string, unknown>) => Promise<unknown>
  }
  projectDeliverable: {
    upsert: (args: Record<string, unknown>) => Promise<unknown>
  }
}

type CreateTaskTx = {
  projectStage: {
    findFirst: (args: Record<string, unknown>) => Promise<{ id: string; key: string } | null>
  }
  projectTask: {
    findFirst: (args: Record<string, unknown>) => Promise<{ position: number } | null>
    create: (args: Record<string, unknown>) => Promise<unknown>
  }
}

async function resolveActorUserId() {
  const session = await auth()
  if (session?.user?.id) return session.user.id

  const fallbackUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  if (!fallbackUser) {
    throw new Error("Aucun utilisateur disponible.")
  }

  return fallbackUser.id
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params
    await resolveActorUserId()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, userId: true, createdAt: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 })
    }

    const pipelineUserId = project.userId

    if (!db.projectStage) {
      return NextResponse.json({ stages: [], projectTitle: project.title })
    }

    let stages = await db.projectStage.findMany({
      where: { projectId, userId: pipelineUserId },
      orderBy: { position: "asc" },
      include: {
        tasks: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          include: { deliverable: true, attachments: true },
        },
      },
    })

    if (stages.length === 0) {
      await createDefaultPipelineForProject(
        prisma as unknown as Parameters<typeof createDefaultPipelineForProject>[0],
        {
          projectId,
          userId: pipelineUserId,
          baselineDate: project.createdAt,
        }
      )

      stages = await db.projectStage.findMany({
        where: { projectId, userId: pipelineUserId },
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            include: { deliverable: true, attachments: true },
          },
        },
      })
    }

    return NextResponse.json({ stages, projectTitle: project.title })
  } catch (error) {
    console.error("[kanban:get]", error)
    return NextResponse.json(
      { error: "Impossible de charger le kanban du projet." },
      { status: 400 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params
    const actorUserId = await resolveActorUserId()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 })
    }

    const pipelineUserId = project.userId

    const body = (await request.json()) as {
      taskId?: string
      toStageId?: string
      note?: string
      hoursSpent?: number
    }

    if (!body.taskId || !body.toStageId) {
      return NextResponse.json(
        { error: "taskId et toStageId sont requis." },
        { status: 400 }
      )
    }

    const taskId = body.taskId
    const toStageId = body.toStageId

    const result = await prisma.$transaction(async (tx) => {
      const trx = tx as unknown as KanbanTx

      const [task, destinationStage] = await Promise.all([
        trx.projectTask.findFirst({
          where: { id: taskId, projectId, userId: pipelineUserId },
          include: { stage: true },
        }),
        trx.projectStage.findFirst({
          where: { id: toStageId, projectId, userId: pipelineUserId },
        }),
      ])

      if (!task?.id || !task.stage?.key || !destinationStage) {
        throw new Error("Tache ou colonne introuvable.")
      }

      const maxPositionTask = await trx.projectTask.findFirst({
        where: { stageId: destinationStage.id },
        orderBy: { position: "desc" },
        select: { position: true },
      })

      const now = new Date()
      const nextStatus = STAGE_STATUS_MAP[destinationStage.key] ?? "todo"

      const updatedTask = await trx.projectTask.update({
        where: { id: task.id },
        data: {
          stageId: destinationStage.id,
          position: (maxPositionTask?.position ?? -1) + 1,
          status: nextStatus,
          startedAt:
            nextStatus === "in_progress" ? task.startedAt ?? now : task.startedAt,
          completedAt: nextStatus === "done" ? now : null,
        },
      })

      await trx.projectTaskTransition.create({
        data: {
          taskId: task.id,
          fromStageKey: task.stage.key,
          toStageKey: destinationStage.key,
          note: body.note,
          movedByUserId: actorUserId,
        },
      })

      if (typeof body.hoursSpent === "number" && body.hoursSpent > 0) {
        await trx.timeEntry.create({
          data: {
            userId: actorUserId,
            activityType: destinationStage.key === "client_review" ? "meeting" : "dev",
            hours: body.hoursSpent,
            date: now,
            description: `Kanban move: ${task.title ?? "task"}`,
          },
        })

        await trx.projectTask.update({
          where: { id: task.id },
          data: {
            actualHours: {
              increment: body.hoursSpent,
            },
          },
        })
      }

      if (updatedTask.type === "deliverable") {
        await trx.projectDeliverable.upsert({
          where: { taskId: updatedTask.id },
          update: {
            status:
              destinationStage.key === "client_review"
                ? "submitted"
                : destinationStage.key === "validated" || destinationStage.key === "done"
                  ? "approved"
                  : "pending",
            submittedAt: destinationStage.key === "client_review" ? now : null,
            approvedAt:
              destinationStage.key === "validated" || destinationStage.key === "done"
                ? now
                : null,
            rejectionReason:
              destinationStage.key === "in_progress"
                ? body.note ?? "Retour client demande des ajustements"
                : null,
          },
          create: {
            title: updatedTask.title,
            status: destinationStage.key === "client_review" ? "submitted" : "pending",
            submittedAt: destinationStage.key === "client_review" ? now : null,
            approvedAt:
              destinationStage.key === "validated" || destinationStage.key === "done"
                ? now
                : null,
            taskId: updatedTask.id,
          },
        })
      }

      await syncProjectStatusFromPipeline(tx, { projectId })

      return updatedTask
    })

    return NextResponse.json({ task: result })
  } catch {
    return NextResponse.json(
      { error: "Impossible de deplacer la tache." },
      { status: 400 }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params
    const actorUserId = await resolveActorUserId()

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 })
    }

    const body = (await request.json()) as {
      stageId?: string
      title?: string
      type?: "task" | "milestone" | "deliverable"
      description?: string
    }

    if (!body.stageId || !body.title?.trim()) {
      return NextResponse.json(
        { error: "stageId et title sont requis." },
        { status: 400 }
      )
    }

    const normalizedTitle = body.title.trim()

    const createdTask = await prisma.$transaction(async (tx) => {
      const trx = tx as unknown as CreateTaskTx

      const stage = await trx.projectStage.findFirst({
        where: { id: body.stageId, projectId, userId: project.userId },
      })

      if (!stage) {
        throw new Error("Colonne introuvable.")
      }

      const lastTask = await trx.projectTask.findFirst({
        where: { stageId: stage.id },
        orderBy: { position: "desc" },
        select: { position: true },
      })

      const status = STAGE_STATUS_MAP[stage.key] ?? "todo"

      return trx.projectTask.create({
        data: {
          title: normalizedTitle,
          description: body.description?.trim() || null,
          type: body.type ?? "task",
          status,
          position: (lastTask?.position ?? -1) + 1,
          projectId,
          stageId: stage.id,
          userId: actorUserId,
        },
      })
    })

    return NextResponse.json({ task: createdTask }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Impossible de creer la tache." },
      { status: 400 }
    )
  }
}
