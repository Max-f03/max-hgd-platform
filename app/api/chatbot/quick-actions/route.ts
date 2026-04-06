import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type QuickAction = {
  label: string;
  message: string;
};

function normalizeQuickActions(value: unknown): QuickAction[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is { label?: unknown; message?: unknown } =>
        !!item && typeof item === "object"
    )
    .map((item) => ({
      label: typeof item.label === "string" ? item.label.trim() : "",
      message: typeof item.message === "string" ? item.message.trim() : "",
    }))
    .filter((item) => item.label.length > 0 && item.message.length > 0);
}

async function getFirstUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return user?.id ?? null;
}

// POST - Save quick actions configuration
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { quickActions?: unknown };
    const { quickActions } = body;

    const normalizedActions = normalizeQuickActions(quickActions);
    if (!Array.isArray(quickActions)) {
      return NextResponse.json(
        { error: "quickActions must be an array" },
        { status: 400 }
      );
    }

    const firstUserId = await getFirstUserId();
    if (!firstUserId) {
      return NextResponse.json({ error: "Aucun utilisateur disponible." }, { status: 400 });
    }

    await prisma.settings.upsert({
      where: { userId: firstUserId },
      update: {
        chatbotQuickActions: normalizedActions,
      },
      create: {
        userId: firstUserId,
        chatbotQuickActions: normalizedActions,
      },
    });

    return NextResponse.json(
      {
        success: true,
        quickActions: normalizedActions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[chatbot:quick-actions:post] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des actions" },
      { status: 500 }
    );
  }
}

// GET - Retrieve quick actions
export async function GET() {
  try {
    const firstUserId = await getFirstUserId();
    if (!firstUserId) {
      return NextResponse.json({ quickActions: [] }, { status: 200 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: firstUserId },
      select: { chatbotQuickActions: true },
    });

    const quickActions = normalizeQuickActions(settings?.chatbotQuickActions);

    return NextResponse.json(
      { quickActions },
      { status: 200 }
    );
  } catch (error) {
    console.error("[chatbot:quick-actions:get] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des actions" },
      { status: 500 }
    );
  }
}
