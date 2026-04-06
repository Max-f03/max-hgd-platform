import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

type DbClient = {
  projectTask: {
    findFirst: (args: Record<string, unknown>) => Promise<{ id: string } | null>
  }
  attachment: {
    create: (args: Record<string, unknown>) => Promise<unknown>
    findMany: (args: Record<string, unknown>) => Promise<unknown[]>
  }
}

async function resolveActorUserId() {
  const session = await auth()
  if (session?.user?.id) return session.user.id

  const fallbackUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  if (!fallbackUser) throw new Error("Aucun utilisateur disponible.")
  return fallbackUser.id
}

export async function GET(req: Request) {
  try {
    const userId = await resolveActorUserId()
    const db = prisma as unknown as DbClient
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "taskId requis." }, { status: 400 })
    }

    const task = await db.projectTask.findFirst({ where: { id: taskId, userId } })
    if (!task) {
      return NextResponse.json({ error: "Tache introuvable." }, { status: 404 })
    }

    const attachments = await db.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ attachments })
  } catch {
    return NextResponse.json({ error: "Impossible de charger les fichiers." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await resolveActorUserId()
    const db = prisma as unknown as DbClient
    const body = (await req.json()) as {
      taskId?: string
      url?: string
      name?: string
      type?: string
      size?: number
    }

    if (!body.taskId || !body.url || !body.name || !body.type || typeof body.size !== "number") {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 })
    }

    const task = await db.projectTask.findFirst({ where: { id: body.taskId, userId } })
    if (!task) {
      return NextResponse.json({ error: "Tache introuvable." }, { status: 404 })
    }

    const attachment = await db.attachment.create({
      data: {
        taskId: body.taskId,
        url: body.url,
        name: body.name,
        type: body.type,
        size: body.size,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Impossible d'ajouter le fichier." }, { status: 500 })
  }
}
