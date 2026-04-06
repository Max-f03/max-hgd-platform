import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      include: { settings: true },
    })

    const useAI = admin?.settings?.chatbotUseAI !== false
    const hasApiKey = !!process.env.GROQ_API_KEY

    return NextResponse.json({
      aiEnabled: useAI && hasApiKey,
      useAI,
      hasApiKey,
      provider: hasApiKey ? "Groq (LLaMA 3.1)" : "Fallback",
    })
  } catch {
    return NextResponse.json({
      aiEnabled: false,
      useAI: false,
      hasApiKey: false,
      provider: "Fallback",
    })
  }
}
