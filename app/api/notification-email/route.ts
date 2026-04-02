import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type SettingsRow = { notificationEmail: string | null };

export async function GET() {
  try {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!user) return NextResponse.json({ notificationEmail: "" });

    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT "notificationEmail" FROM "Settings" WHERE "userId" = ${user.id} LIMIT 1
    `;

    return NextResponse.json({ notificationEmail: rows[0]?.notificationEmail ?? "" });
  } catch (err) {
    console.error("[notification-email GET]", err);
    return NextResponse.json({ notificationEmail: "" });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { notificationEmail?: string };
    const emailValue = body.notificationEmail?.trim() || null;

    const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    await prisma.$executeRaw`
      INSERT INTO "Settings" (id, "userId", "notificationEmail", "chatbotPersonality", "chatbotEnabled", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.id}, ${emailValue}, 'professional', true, NOW(), NOW())
      ON CONFLICT ("userId") DO UPDATE SET "notificationEmail" = EXCLUDED."notificationEmail", "updatedAt" = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notification-email PUT]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
