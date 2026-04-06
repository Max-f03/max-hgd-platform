import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const links = await prisma.socialLink.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(links);
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
      platform?: string;
      url?: string;
      username?: string;
    };

    const { platform, url, username } = body;

    if (!platform?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Plateforme et URL requis" }, { status: 400 });
    }

    const count = await prisma.socialLink.count({
      where: { userId: session.user.id },
    });

    const link = await prisma.socialLink.create({
      data: {
        platform: platform.trim().toLowerCase(),
        url: url.trim(),
        username: username?.trim() || null,
        order: count,
        userId: session.user.id,
      },
    });

    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
