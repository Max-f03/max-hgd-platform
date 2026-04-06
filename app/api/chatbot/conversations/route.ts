import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "20", 10)

    const where: { status?: string } = {}
    if (status && status !== "all") {
      where.status = status
    }

    const [conversations, total] = await Promise.all([
      prisma.chatbotConversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatbotConversation.count({ where }),
    ])

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const body = (await request.json()) as { conversationId?: string; status?: string }
    const { conversationId, status } = body

    if (!conversationId || !status) {
      return NextResponse.json(
        { error: "conversationId et status requis" },
        { status: 400 }
      )
    }

    const updated = await prisma.chatbotConversation.update({
      where: { id: conversationId },
      data: { status },
    })

    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 })
    }

    await prisma.chatbotConversation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
