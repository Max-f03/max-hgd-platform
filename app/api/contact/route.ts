import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendContactEmail } from "@/lib/email";

type ProjectType = "" | "ux-ui" | "frontend" | "branding" | "autre";

const projectTypeLabelMap: Record<ProjectType, string> = {
  "": "Non precise",
  "ux-ui": "UX/UI Design",
  frontend: "Frontend Development",
  branding: "Branding / Logo",
  autre: "Autre",
};

async function resolveAdminUser() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  return user ?? null;
}

async function getNotificationEmail(userId: string): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ notificationEmail: string | null }>>`
      SELECT "notificationEmail" FROM "Settings" WHERE "userId" = ${userId} LIMIT 1
    `;
    return rows[0]?.notificationEmail ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      projectType?: ProjectType;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const message = body.message?.trim() ?? "";
    const projectType = body.projectType ?? "";

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Nom, email et message requis." }, { status: 400 });
    }

    const adminUser = await resolveAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Aucun compte admin disponible." }, { status: 500 });
    }

    const projectTypeLabel = projectTypeLabelMap[projectType] ?? "Autre";

    let client = await prisma.client.findUnique({ where: { email } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          name,
          email,
          status: "lead",
          priority: "normal",
          tags: ["website-contact"],
          notes: `Contact depuis le site. Type de projet: ${projectTypeLabel}`,
          userId: adminUser.id,
        },
      });
    }

    const normalizedMessage = [
      `Nouveau message via formulaire public`,
      `Nom: ${name}`,
      `Email: ${email}`,
      `Type de projet: ${projectTypeLabel}`,
      "",
      message,
    ].join("\n");

    const createdMessage = await prisma.message.create({
      data: {
        content: normalizedMessage,
        type: "text",
        direction: "received",
        status: "unread",
        clientId: client.id,
        userId: adminUser.id,
      },
    });

    await prisma.notification.create({
      data: {
        type: "contact-message",
        title: "Nouveau message du site",
        message: `${name} vous a ecrit via le formulaire de contact.`,
        resourceType: "message",
        resourceId: createdMessage.id,
        userId: adminUser.id,
      },
    });

    const notificationEmail = await getNotificationEmail(adminUser.id);
    const recipientEmail =
      notificationEmail ||
      process.env.CONTACT_RECEIVER_EMAIL ||
      adminUser.email;

    let emailSent = false;
    try {
      emailSent = await sendContactEmail({
        to: recipientEmail,
        fromName: name,
        fromEmail: email,
        projectTypeLabel,
        message,
      });
    } catch {
      emailSent = false;
    }

    return NextResponse.json({ success: true, emailSent });
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
}
