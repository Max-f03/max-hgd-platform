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
      platform?: string;
      url?: string;
      username?: string | null;
      isActive?: boolean;
      order?: number;
    };

    const existing = await prisma.socialLink.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reseau introuvable" }, { status: 404 });
    }

    const link = await prisma.socialLink.update({
      where: { id },
      data: {
        ...(body.platform !== undefined ? { platform: body.platform.trim().toLowerCase() } : {}),
        ...(body.url !== undefined ? { url: body.url.trim() } : {}),
        ...(body.username !== undefined ? { username: body.username?.trim() || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
      },
    });

    return NextResponse.json(link);
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

    const existing = await prisma.socialLink.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reseau introuvable" }, { status: 404 });
    }

    await prisma.socialLink.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
