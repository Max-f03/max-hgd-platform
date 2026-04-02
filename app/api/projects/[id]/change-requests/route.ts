import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { syncProjectStatusFromPipeline } from "@/lib/project-pipeline"

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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params
    const userId = await resolveActorUserId()

    const body = (await request.json()) as {
      reason?: string
      title?: string
      dueDate?: string
    }

    if (!body.reason?.trim()) {
      return NextResponse.json(
        { error: "Le motif de modification est requis." },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const trx = tx as unknown as {
        projectStage: {
          findFirst: (args: {
            where: { projectId: string; userId: string; key: string }
          }) => Promise<{ id: string } | null>
        }
        projectTask: {
          findFirst: (args: {
            where: { stageId: string }
            orderBy: { position: "desc" }
            select: { position: true }
          }) => Promise<{ position: number } | null>
          create: (args: { data: Record<string, unknown> }) => Promise<unknown>
        }
        projectChangeRequest: {
          create: (args: { data: Record<string, unknown> }) => Promise<unknown>
        }
        project: {
          update: (args: {
            where: { id: string }
            data: { status: string }
          }) => Promise<unknown>
        }
      }

      const backlogStage = await trx.projectStage.findFirst({
        where: { projectId, userId, key: "backlog" },
      })

      const todoStage = await trx.projectStage.findFirst({
        where: { projectId, userId, key: "todo" },
      })

      const targetStage = backlogStage ?? todoStage
      if (!targetStage) {
        throw new Error("Pipeline non configure pour ce projet.")
      }

      const maxPosition = await trx.projectTask.findFirst({
        where: { stageId: targetStage.id },
        orderBy: { position: "desc" },
        select: { position: true },
      })

      const task = await trx.projectTask.create({
        data: {
          title: body.title?.trim() || "Modification demandee client",
          description: body.reason,
          type: "task",
          status: "todo",
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          projectId,
          stageId: targetStage.id,
          userId,
          position: (maxPosition?.position ?? -1) + 1,
        },
      })

      const changeRequest = await trx.projectChangeRequest.create({
        data: {
          reason: body.reason,
          projectId,
          userId,
        },
      })

      await trx.project.update({
        where: { id: projectId },
        data: { status: "draft" },
      })

      await syncProjectStatusFromPipeline(tx, { projectId })

      return { changeRequest, task }
    })

    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Impossible de creer la demande de modification." },
      { status: 400 }
    )
  }
}
