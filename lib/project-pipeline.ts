import type { Prisma } from "@prisma/client"

const DEFAULT_STAGE_TEMPLATES = [
  { key: "backlog", name: "Backlog", color: "#93C5FD" },
  { key: "todo", name: "A faire", color: "#60A5FA" },
  { key: "in_progress", name: "En cours", color: "#3B82F6" },
  { key: "client_review", name: "En review client", color: "#2563EB" },
  { key: "validated", name: "Valide", color: "#1D4ED8" },
  { key: "done", name: "Termine", color: "#1E40AF" },
] as const

const DEFAULT_TASK_TEMPLATES = [
  { title: "Cadrage projet", type: "milestone", stageKey: "todo", daysOffset: 2, position: 1 },
  { title: "Wireframes et parcours", type: "task", stageKey: "todo", daysOffset: 5, position: 2 },
  { title: "Design UI complet", type: "task", stageKey: "todo", daysOffset: 9, position: 3 },
  { title: "Developpement principal", type: "task", stageKey: "backlog", daysOffset: 14, position: 4 },
  { title: "QA et recettes", type: "task", stageKey: "backlog", daysOffset: 18, position: 5 },
  { title: "Livrable client final", type: "deliverable", stageKey: "backlog", daysOffset: 21, position: 6 },
] as const

type TxClient = Prisma.TransactionClient

function addDays(baseDate: Date, days: number): Date {
  const nextDate = new Date(baseDate)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export async function createDefaultPipelineForProject(
  tx: TxClient,
  params: {
    projectId: string
    userId: string
    baselineDate?: Date
  }
) {
  const baselineDate = params.baselineDate ?? new Date()
  const db = tx as unknown as {
    projectStage?: {
      create: (args: {
        data: {
          key: string
          name: string
          color?: string
          position: number
          projectId: string
          userId: string
        }
      }) => Promise<{ id: string; key: string }>
    }
    projectTask?: {
      create: (args: {
        data: {
          title: string
          type: string
          status: string
          dueDate: Date
          position: number
          projectId: string
          stageId: string
          userId: string
        }
      }) => Promise<{ id: string }>
    }
    projectDeliverable?: {
      create: (args: {
        data: { title: string; expectedAt: Date; taskId: string }
      }) => Promise<unknown>
    }
  }

  if (!db.projectStage) {
    return
  }

  const projectStageRepo = db.projectStage
  const projectTaskRepo = db.projectTask
  const projectDeliverableRepo = db.projectDeliverable

  const stages = await Promise.all(
    DEFAULT_STAGE_TEMPLATES.map((stage, index) =>
      projectStageRepo.create({
        data: {
          key: stage.key,
          name: stage.name,
          color: stage.color,
          position: index,
          projectId: params.projectId,
          userId: params.userId,
        },
      })
    )
  )

  const stageIdByKey = new Map(
    stages.map((stage: { key: string; id: string }) => [stage.key, stage.id])
  )

  // If task delegate is unavailable in the current runtime, keep stages only.
  if (!projectTaskRepo) {
    return
  }

  for (const taskTemplate of DEFAULT_TASK_TEMPLATES) {
    const stageId = stageIdByKey.get(taskTemplate.stageKey)
    if (!stageId) continue

    const task = await projectTaskRepo.create({
      data: {
        title: taskTemplate.title,
        type: taskTemplate.type,
        status: "todo",
        dueDate: addDays(baselineDate, taskTemplate.daysOffset),
        position: taskTemplate.position,
        projectId: params.projectId,
        stageId,
        userId: params.userId,
      },
    })

    if (taskTemplate.type === "deliverable" && projectDeliverableRepo) {
      await projectDeliverableRepo.create({
        data: {
          title: taskTemplate.title,
          expectedAt: addDays(baselineDate, taskTemplate.daysOffset),
          taskId: task.id,
        },
      })
    }
  }
}

export async function syncProjectStatusFromPipeline(
  tx: TxClient,
  params: {
    projectId: string
  }
) {
  const db = tx as unknown as {
    projectTask: {
      count: (args: { where: { projectId: string; status?: string } }) => Promise<number>
    }
    project: {
      update: (args: {
        where: { id: string }
        data: { status: string }
      }) => Promise<unknown>
    }
  }

  const [totalCount, completedCount] = await Promise.all([
    db.projectTask.count({ where: { projectId: params.projectId } }),
    db.projectTask.count({
      where: { projectId: params.projectId, status: "done" },
    }),
  ])

  if (totalCount === 0) {
    return
  }

  const shouldBeCompleted = completedCount === totalCount

  await db.project.update({
    where: { id: params.projectId },
    data: {
      status: shouldBeCompleted ? "completed" : "draft",
    },
  })
}
