import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
      question?: string;
      answer?: string;
      category?: string | null;
      isActive?: boolean;
      order?: number;
    };

    const existing = await prisma.chatbotFAQ.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "FAQ introuvable" }, { status: 404 });
    }

    const faq = await prisma.chatbotFAQ.update({
      where: { id },
      data: {
        ...(body.question !== undefined ? { question: body.question.trim() } : {}),
        ...(body.answer !== undefined ? { answer: body.answer.trim() } : {}),
        ...(body.category !== undefined ? { category: body.category?.trim() || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
      },
    });

    return NextResponse.json(faq);
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

    const existing = await prisma.chatbotFAQ.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "FAQ introuvable" }, { status: 404 });
    }

    await prisma.chatbotFAQ.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
