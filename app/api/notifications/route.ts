import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function resolveUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const fallbackUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return fallbackUser?.id ?? null;
}

export async function GET(request: Request) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "6");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 6;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
        resourceType: true,
      },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      read: item.read,
      resourceType: item.resourceType,
      createdAt: item.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const body = (await request.json()) as { action?: string };
    if (body.action !== "markAllRead") {
      return NextResponse.json({ error: "Action non supportee." }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
}
