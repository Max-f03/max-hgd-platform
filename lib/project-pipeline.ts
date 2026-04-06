import type { Prisma } from "@prisma/client"

type WorkflowMode = "template" | "empty" | "duplicate"
type WorkflowTemplateKey = "site-web" | "branding" | "app-mobile" | "design-ui"

type StageTemplate = { key: string; name: string; color?: string }
type TaskTemplate = {
  title: string
  type: "task" | "milestone" | "deliverable"
  stageKey: string
  daysOffset: number
  position: number
}

type PipelineTemplate = {
  label: string
  stages: StageTemplate[]
  tasks: TaskTemplate[]
}

const EMPTY_BOARD_STAGES: StageTemplate[] = [
  { key: "todo", name: "A faire", color: "#60A5FA" },
  { key: "in_progress", name: "Developpement", color: "#3B82F6" },
  { key: "testing", name: "Test", color: "#2563EB" },
  { key: "done", name: "Termine", color: "#1E40AF" },
]

const WORKFLOW_TEMPLATES: Record<WorkflowTemplateKey, PipelineTemplate> = {
  "site-web": {
    label: "Site web",
    stages: EMPTY_BOARD_STAGES,
    tasks: [
      { title: "Wireframe", type: "milestone", stageKey: "todo", daysOffset: 2, position: 1 },
      { title: "UI Design", type: "task", stageKey: "todo", daysOffset: 5, position: 2 },
      { title: "Integration", type: "task", stageKey: "in_progress", daysOffset: 10, position: 3 },
      { title: "Responsive", type: "task", stageKey: "in_progress", daysOffset: 12, position: 4 },
      { title: "SEO", type: "deliverable", stageKey: "testing", daysOffset: 16, position: 5 },
    ],
  },
  branding: {
    label: "Branding",
    stages: EMPTY_BOARD_STAGES,
    tasks: [
      { title: "Atelier de recherche", type: "milestone", stageKey: "todo", daysOffset: 2, position: 1 },
      { title: "Direction artistique", type: "task", stageKey: "todo", daysOffset: 4, position: 2 },
      { title: "Creation logo", type: "task", stageKey: "in_progress", daysOffset: 8, position: 3 },
      { title: "Declinaisons", type: "task", stageKey: "in_progress", daysOffset: 12, position: 4 },
      { title: "Kit de livraison", type: "deliverable", stageKey: "testing", daysOffset: 15, position: 5 },
    ],
  },
  "app-mobile": {
    label: "App mobile",
    stages: EMPTY_BOARD_STAGES,
    tasks: [
      { title: "User flow mobile", type: "milestone", stageKey: "todo", daysOffset: 2, position: 1 },
      { title: "Design system mobile", type: "task", stageKey: "todo", daysOffset: 5, position: 2 },
      { title: "Developpement ecrans", type: "task", stageKey: "in_progress", daysOffset: 10, position: 3 },
      { title: "Tests devices", type: "task", stageKey: "testing", daysOffset: 14, position: 4 },
      { title: "Store package", type: "deliverable", stageKey: "testing", daysOffset: 18, position: 5 },
    ],
  },
  "design-ui": {
    label: "Design UI",
    stages: EMPTY_BOARD_STAGES,
    tasks: [
      { title: "Moodboard", type: "milestone", stageKey: "todo", daysOffset: 2, position: 1 },
      { title: "Composants principaux", type: "task", stageKey: "todo", daysOffset: 4, position: 2 },
      { title: "Ecrans cles", type: "task", stageKey: "in_progress", daysOffset: 8, position: 3 },
      { title: "Prototype interactif", type: "task", stageKey: "testing", daysOffset: 11, position: 4 },
      { title: "Handoff", type: "deliverable", stageKey: "testing", daysOffset: 13, position: 5 },
    ],
  },
}

const DEFAULT_TEMPLATE_KEY: WorkflowTemplateKey = "site-web"

type TxClient = Prisma.TransactionClient

type PipelineGenerationResult = {
  mode: WorkflowMode
  templateKey: string
  label: string
  createdStageCount: number
  createdTaskCount: number
}

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
    workflow?: {
      mode?: WorkflowMode
      templateKey?: string
      duplicateProjectId?: string
    }
  }
) {
  const baselineDate = params.baselineDate ?? new Date()
  const workflowMode: WorkflowMode = params.workflow?.mode ?? "template"
  const incomingTemplate = params.workflow?.templateKey as WorkflowTemplateKey | undefined
  const templateKey = incomingTemplate && WORKFLOW_TEMPLATES[incomingTemplate] ? incomingTemplate : DEFAULT_TEMPLATE_KEY

  const db = tx as unknown as {
    projectStage?: {
      findMany?: (args: {
        where: { projectId: string; userId: string }
        orderBy: { position: "asc" }
        include?: {
          tasks: {
            orderBy: Array<{ position: "asc" } | { createdAt: "asc" }>
          }
        }
      }) => Promise<
        Array<{
          id: string
          key: string
          name: string
          color?: string | null
          position: number
          tasks?: Array<{
            title: string
            type: string
            status: string
            dueDate: Date | null
            position: number
          }>
        }>
      >
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
      findMany?: (args: {
        where: { projectId: string; userId: string }
        orderBy: Array<{ position: "asc" } | { createdAt: "asc" }>
      }) => Promise<Array<{ id: string; stageId: string; title: string; type: string; status: string; dueDate: Date | null; position: number }>>
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
    return {
      mode: workflowMode,
      templateKey,
      label: "Kanban",
      createdStageCount: 0,
      createdTaskCount: 0,
    } satisfies PipelineGenerationResult
  }

  const projectStageRepo = db.projectStage
  const projectTaskRepo = db.projectTask
  const projectDeliverableRepo = db.projectDeliverable

  const selectedTemplate = WORKFLOW_TEMPLATES[templateKey]
  const selectedStages = workflowMode === "empty" ? EMPTY_BOARD_STAGES : selectedTemplate.stages
  const selectedTasks = workflowMode === "template" ? selectedTemplate.tasks : []

  if (
    workflowMode === "duplicate" &&
    params.workflow?.duplicateProjectId &&
    projectStageRepo.findMany &&
    projectTaskRepo?.findMany
  ) {
    const sourceStages = await projectStageRepo.findMany({
      where: { projectId: params.workflow.duplicateProjectId, userId: params.userId },
      orderBy: { position: "asc" },
      include: {
        tasks: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    })

    if (sourceStages.length > 0) {
      let createdTaskCount = 0
      const duplicatedStages = await Promise.all(
        sourceStages.map((stage, index) =>
          projectStageRepo.create({
            data: {
              key: stage.key,
              name: stage.name,
              color: stage.color ?? undefined,
              position: index,
              projectId: params.projectId,
              userId: params.userId,
            },
          })
        )
      )

      if (projectTaskRepo) {
        const targetStageByKey = new Map(duplicatedStages.map((stage) => [stage.key, stage.id]))
        for (const sourceStage of sourceStages) {
          const nextStageId = targetStageByKey.get(sourceStage.key)
          if (!nextStageId) continue

          for (const sourceTask of sourceStage.tasks ?? []) {
            await projectTaskRepo.create({
              data: {
                title: sourceTask.title,
                type: sourceTask.type,
                status: sourceTask.status,
                dueDate: sourceTask.dueDate ?? addDays(baselineDate, 7),
                position: sourceTask.position,
                projectId: params.projectId,
                stageId: nextStageId,
                userId: params.userId,
              },
            })
            createdTaskCount += 1
          }
        }
      }

      return {
        mode: "duplicate",
        templateKey: "duplicate",
        label: "Copie d'un projet existant",
        createdStageCount: duplicatedStages.length,
        createdTaskCount,
      } satisfies PipelineGenerationResult
    }
  }

  const stages = await Promise.all(
    selectedStages.map((stage, index) =>
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
    return {
      mode: workflowMode,
      templateKey,
      label: workflowMode === "empty" ? "Kanban vide" : selectedTemplate.label,
      createdStageCount: stages.length,
      createdTaskCount: 0,
    } satisfies PipelineGenerationResult
  }

  for (const taskTemplate of selectedTasks) {
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

  return {
    mode: workflowMode,
    templateKey,
    label: workflowMode === "empty" ? "Kanban vide" : selectedTemplate.label,
    createdStageCount: stages.length,
    createdTaskCount: selectedTasks.length,
  } satisfies PipelineGenerationResult
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
