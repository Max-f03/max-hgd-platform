import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const services = await prisma.chatbotService.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(services);
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
      name?: string;
      description?: string;
      priceRange?: string;
      icon?: string;
    };

    const { name, description, priceRange, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const count = await prisma.chatbotService.count({
      where: { userId: session.user.id },
    });

    const service = await prisma.chatbotService.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        priceRange: priceRange?.trim() || null,
        icon: icon?.trim() || null,
        order: count,
        userId: session.user.id,
      },
    });

    return NextResponse.json(service);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
