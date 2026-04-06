import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const faqs = await prisma.chatbotFAQ.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(faqs);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = (await request.json()) as {
      question?: string;
      answer?: string;
      category?: string;
    };

    const { question, answer, category } = body;

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: "Question et reponse requises" }, { status: 400 });
    }

    const count = await prisma.chatbotFAQ.count({
      where: { userId: session.user.id },
    });

    const faq = await prisma.chatbotFAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: category?.trim() || null,
        order: count,
        userId: session.user.id,
      },
    });

    return NextResponse.json(faq);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
