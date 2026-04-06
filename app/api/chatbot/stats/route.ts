import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalConversations,
      conversationsThisMonth,
      conversationsThisWeek,
      totalMessages,
      activeConversations,
      needsFollowup,
    ] = await Promise.all([
      prisma.chatbotConversation.count(),
      prisma.chatbotConversation.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.chatbotConversation.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.chatbotMessage.count(),
      prisma.chatbotConversation.count({ where: { status: "active" } }),
      prisma.chatbotConversation.count({ where: { status: "needs_followup" } }),
    ]);

    const recentMessages = await prisma.chatbotMessage.findMany({
      where: { role: "user" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { content: true },
    });

    const themes: Record<string, number> = {
      Services: 0,
      Tarifs: 0,
      Contact: 0,
      Projets: 0,
      Autres: 0,
    };

    for (const msg of recentMessages) {
      const content = msg.content.toLowerCase();
      if (content.includes("service") || content.includes("propose")) themes.Services += 1;
      else if (content.includes("tarif") || content.includes("prix") || content.includes("cout")) themes.Tarifs += 1;
      else if (content.includes("contact") || content.includes("email") || content.includes("joindre")) themes.Contact += 1;
      else if (content.includes("projet") || content.includes("portfolio")) themes.Projets += 1;
      else themes.Autres += 1;
    }

    return NextResponse.json({
      totalConversations,
      conversationsThisMonth,
      conversationsThisWeek,
      totalMessages,
      activeConversations,
      needsFollowup,
      topThemes: Object.entries(themes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([theme, count]) => ({ theme, count })),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
