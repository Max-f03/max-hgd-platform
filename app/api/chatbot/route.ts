import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateChatResponse, type ActionButton, type ChatResponse } from "@/lib/groq"

interface FallbackContext {
  personalInfo?: {
    name?: string
    email?: string
  }
  services?: Array<{ name: string }>
}

function getFallbackResponse(message: string, context: FallbackContext): ChatResponse {
  const lowerMessage = message.toLowerCase()

  if (/^(bonjour|salut|hello|hey|coucou|bonsoir)/i.test(lowerMessage)) {
    return {
      message: "Bonjour ! Bienvenue. Comment puis-je vous aider ? Vous cherchez un designer, un developpeur, ou les deux ?",
      actions: [
        { label: "Voir les projets", url: "/portfolio" },
        { label: "Me contacter", url: "/contact" },
      ],
    }
  }

  if (/projet|portfolio|realisation|travaux|exemple|montre|voir/i.test(lowerMessage)) {
    return {
      message: "Decouvrez tous les projets sur la page Portfolio : applications, sites e-commerce, dashboards et plus encore !",
      actions: [
        { label: "Voir le portfolio", url: "/portfolio" },
        { label: "Demander un devis", url: "/contact" },
      ],
    }
  }

  if (/service|propose|offre|faire|competence/i.test(lowerMessage)) {
    const serviceList =
      context.services && context.services.length > 0
        ? context.services.map((s) => s.name).join(", ")
        : "UX/UI Design, Developpement Frontend, Design System, Audit UX"
    return {
      message: `Je propose : ${serviceList}. Lequel vous interesse ?`,
      actions: [
        { label: "Voir les projets", url: "/portfolio" },
        { label: "Demander un devis", url: "/contact" },
      ],
    }
  }

  if (/tarif|prix|cout|devis|combien|budget/i.test(lowerMessage)) {
    return {
      message: "Les tarifs varient selon le projet. Decrivez-moi votre besoin et je vous ferai une proposition personnalisee !",
      actions: [{ label: "Demander un devis", url: "/contact" }],
    }
  }

  if (/contact|email|joindre|appeler|telephone|whatsapp|ecrire/i.test(lowerMessage)) {
    const emailPart = context.personalInfo?.email
      ? ` par email (${context.personalInfo.email}) ou`
      : ""
    return {
      message: `Vous pouvez me contacter${emailPart} via le formulaire de contact. Je reponds sous 24h !`,
      actions: [{ label: "Me contacter", url: "/contact" }],
    }
  }

  if (/qui es|a propos|parcours|experience|toi/i.test(lowerMessage)) {
    const name = context.personalInfo?.name
    const msg = name
      ? `Je suis ${name}, designer/developpeur passionne par la creation d'experiences digitales !`
      : "Je suis un designer/developpeur passionne par la creation d'experiences digitales."
    return {
      message: msg,
      actions: [
        { label: "En savoir plus", url: "/about" },
        { label: "Voir les projets", url: "/portfolio" },
      ],
    }
  }

  if (/merci|thanks|super|genial|parfait/i.test(lowerMessage)) {
    return {
      message: "Avec plaisir ! N'hesitez pas a me contacter si vous avez un projet en tete.",
      actions: [{ label: "Me contacter", url: "/contact" }],
    }
  }

  return {
    message: "Je suis la pour vous aider ! Vous cherchez des infos sur mes services, mes projets, ou vous voulez discuter d'un projet ?",
    actions: [
      { label: "Voir les projets", url: "/portfolio" },
      { label: "Me contacter", url: "/contact" },
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { message?: string; sessionId?: string }
    const { message, sessionId } = body

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "Message et sessionId requis" },
        { status: 400 }
      )
    }

    const adminRaw = await prisma.user.findFirst({
      where: { role: "admin" },
      include: {
        settings: true,
        chatbotServices: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        socialLinks: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        chatbotFAQs: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!adminRaw) {
      return NextResponse.json(
        { error: "Configuration manquante" },
        { status: 500 }
      )
    }

    let adminSettings = adminRaw.settings
    if (!adminSettings) {
      adminSettings = await prisma.settings.create({
        data: {
          userId: adminRaw.id,
          chatbotEnabled: true,
          chatbotUseAI: true,
          chatbotWelcome: "Bonjour ! Comment puis-je vous aider ?",
          chatbotPersonality: "friendly",
          chatbotPrimaryColor: "#3B82F6",
        },
      })
    }

    const admin = { ...adminRaw, settings: adminSettings }
    const personality = adminSettings.chatbotPersonality ?? "friendly"
    const useAI = adminSettings.chatbotUseAI !== false

    let conversation = await prisma.chatbotConversation.findFirst({
      where: { sessionId, status: "active" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.chatbotConversation.create({
        data: { sessionId },
        include: { messages: true },
      })
    }

    await prisma.chatbotMessage.create({
      data: {
        role: "user",
        content: message,
        conversationId: conversation.id,
      },
    })

    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    const fallbackContext: FallbackContext = {
      personalInfo: {
        name: adminSettings.publicName ?? undefined,
        email: adminSettings.publicEmail ?? undefined,
      },
      services: admin.chatbotServices,
    }

    let responseContent: string
    let responseActions: ActionButton[] = []

    if (useAI && process.env.GROQ_API_KEY) {
      try {
        const projects = await prisma.project.findMany({
          where: { userId: admin.id, status: "published" },
          select: { title: true },
          take: 5,
        })

        const aiResponse = await generateChatResponse({
          message,
          conversationHistory,
          personality,
          context: {
            personalInfo: {
              name: adminSettings.publicName ?? undefined,
              title: adminSettings.publicTitle ?? undefined,
              email: admin.email,
              phone: adminSettings.publicPhone ?? undefined,
              location: adminSettings.publicLocation ?? undefined,
              availability: adminSettings.publicAvailability ?? undefined,
            },
            services: admin.chatbotServices.map((s) => ({
              name: s.name,
              description: s.description ?? undefined,
              priceRange: s.priceRange ?? undefined,
            })),
            socialLinks: admin.socialLinks.map((l) => ({
              platform: l.platform,
              url: l.url,
              username: l.username ?? undefined,
            })),
            faqs: admin.chatbotFAQs.map((f) => ({
              question: f.question,
              answer: f.answer,
            })),
            projects: projects.map((p) => p.title),
          },
        })

        responseContent = aiResponse.message
        responseActions = aiResponse.actions
      } catch (aiError) {
        console.error("AI error, using fallback:", aiError)
        const fallback = getFallbackResponse(message, fallbackContext)
        responseContent = fallback.message
        responseActions = fallback.actions
      }
    } else {
      const fallback = getFallbackResponse(message, fallbackContext)
      responseContent = fallback.message
      responseActions = fallback.actions
    }

    await prisma.chatbotMessage.create({
      data: {
        role: "assistant",
        content: responseContent,
        conversationId: conversation.id,
      },
    })

    await prisma.chatbotConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ message: responseContent, actions: responseActions })
  } catch (error) {
    console.error("Chatbot error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 })
    }

    const conversation = await prisma.chatbotConversation.findFirst({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({
      conversationId: conversation.id,
      messages: conversation.messages,
    })
  } catch (error) {
    console.error("Get conversation error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
