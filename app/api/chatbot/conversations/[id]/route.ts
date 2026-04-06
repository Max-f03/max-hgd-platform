import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { id } = await params;

    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvee" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      notes?: string | null;
      rating?: number | null;
      visitorName?: string | null;
      visitorEmail?: string | null;
      visitorPhone?: string | null;
    };

    const conversation = await prisma.chatbotConversation.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes?.trim() || null } : {}),
        ...(body.rating !== undefined ? { rating: body.rating } : {}),
        ...(body.visitorName !== undefined ? { visitorName: body.visitorName?.trim() || null } : {}),
        ...(body.visitorEmail !== undefined ? { visitorEmail: body.visitorEmail?.trim() || null } : {}),
        ...(body.visitorPhone !== undefined ? { visitorPhone: body.visitorPhone?.trim() || null } : {}),
      },
    });

    return NextResponse.json(conversation);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.chatbotConversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
