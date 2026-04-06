import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface Service {
  name: string
  description?: string
  priceRange?: string
}

interface SocialLink {
  platform: string
  url: string
  username?: string
}

interface FAQ {
  question: string
  answer: string
}

interface PersonalInfo {
  name?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  availability?: string
}

export interface ActionButton {
  label: string
  url: string
}

export interface ChatResponse {
  message: string
  actions: ActionButton[]
}

interface GenerateResponseParams {
  message: string
  conversationHistory: ChatMessage[]
  personality: string
  context?: {
    personalInfo?: PersonalInfo
    services?: Service[]
    socialLinks?: SocialLink[]
    faqs?: FAQ[]
    projects?: string[]
  }
}

const personalityPrompts: Record<string, string> = {
  friendly: `Tu es un assistant virtuel chaleureux et accessible.
Tu parles comme un humain, pas comme un robot.
Tu es la pour aider les visiteurs a decouvrir les services et a passer a l'action.
Tu es enthousiaste mais professionnel.`,

  professional: `Tu es un assistant professionnel et courtois.
Tu donnes des reponses claires et orientees solution.
Tu guides les visiteurs vers les bonnes ressources.`,

  casual: `Tu es un assistant decontracte et moderne.
Tu parles de maniere simple et directe.
Tu es la pour aider rapidement.`,

  technical: `Tu es un assistant technique et precis.
Tu donnes des explications detaillees quand necessaire.
Tu restes accessible meme dans les explications complexes.`,
}

export async function generateChatResponse({
  message,
  conversationHistory,
  personality,
  context,
}: GenerateResponseParams): Promise<ChatResponse> {
  const { personalInfo, services, socialLinks, faqs, projects } = context || {}

  let contextInfo = ""

  if (personalInfo?.name) {
    contextInfo += `
INFORMATIONS SUR MOI :
- Je m'appelle : ${personalInfo.name}
- Mon metier : ${personalInfo.title || "Designer/Developpeur"}
- Email : ${personalInfo.email || "Non specifie"}
- Telephone : ${personalInfo.phone || "Non specifie"}
- Localisation : ${personalInfo.location || "Non specifie"}
- Disponibilite : ${personalInfo.availability || "Disponible pour de nouveaux projets"}
`
  }

  if (socialLinks && socialLinks.length > 0) {
    contextInfo += `
MES RESEAUX SOCIAUX :
${socialLinks.map((l) => `- ${l.platform} : ${l.url}${l.username ? ` (${l.username})` : ""}`).join("\n")}
`
  }

  if (services && services.length > 0) {
    contextInfo += `
MES SERVICES :
${services
  .map(
    (s, i) =>
      `${i + 1}. ${s.name}${s.description ? ` : ${s.description}` : ""}${s.priceRange ? ` (${s.priceRange})` : ""}`
  )
  .join("\n")}
`
  }

  if (faqs && faqs.length > 0) {
    contextInfo += `
QUESTIONS FREQUENTES :
${faqs.map((f) => `Q: ${f.question}\nR: ${f.answer}`).join("\n\n")}
`
  }

  if (projects && projects.length > 0) {
    contextInfo += `
MES PROJETS RECENTS :
${projects.map((p) => `- ${p}`).join("\n")}
`
  }

  const systemPrompt = `${personalityPrompts[personality] ?? personalityPrompts.friendly}

Tu es l'assistant virtuel d'un designer/developpeur freelance.

${contextInfo}

PAGES DU SITE (pour rediriger les visiteurs) :
- /portfolio : Voir tous les projets et realisations
- /contact : Formulaire de contact et demande de devis
- /about : Parcours et competences
- / : Page d'accueil

REGLES :
1. Reponds TOUJOURS en francais
2. Sois naturel et oriente ACTION (2-4 phrases max)
3. Quand quelqu'un veut voir des projets/realisations, envoie-le sur /portfolio
4. Quand quelqu'un veut un devis ou collaborer, envoie-le sur /contact
5. Sois commercial : convertis les visiteurs en clients
6. Propose toujours une action concrete

FORMAT DE REPONSE (JSON uniquement, aucun texte avant ou apres) :
{
  "message": "ta reponse textuelle",
  "actions": [
    { "label": "Libelle du bouton", "url": "/chemin-ou-https://..." }
  ]
}

Maximum 2 actions. Si aucune action pertinente, laisse le tableau vide.`

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: "user", content: message },
  ]

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    max_tokens: 500,
    top_p: 0.9,
  })

  const responseText = completion.choices[0]?.message?.content

  if (!responseText) {
    throw new Error("Pas de reponse de Groq")
  }

  // Nettoyer les backticks markdown si presents
  let cleaned = responseText.trim()
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7)
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3)
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()

  try {
    const parsed = JSON.parse(cleaned) as { message?: string; actions?: ActionButton[] }
    return {
      message: typeof parsed.message === "string" ? parsed.message : responseText.trim(),
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    }
  } catch {
    return {
      message: responseText.trim(),
      actions: [],
    }
  }
}
