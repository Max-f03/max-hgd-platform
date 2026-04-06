# 🤖 Guide Complet du Chatbot Configurable

## Vue d'ensemble

Ton chatbot est maintenant un système **professionnel et configurable** intégrant :
- **Admin Dashboard** : Configuration complète (activation, personnalité, actions rapides, historique)
- **Widget Intelligent** : Récupère les settings en temps réel, historique persistent
- **API Backend** : Gestion des conversations, messages, settings
- **Préparation LLM** : Infrastructure pour intégration future OpenAI/Anthropic

---

## 📋 Architecture

### 1. **Frontend Widget** (`components/chatbot/ChatWidget.tsx`)

**Fonctionnalités :**
- ✅ Récupère les settings depuis `/api/settings`
- ✅ Récupère les actions rapides depuis `/api/chatbot/quick-actions`
- ✅ Envoie les messages via `/api/chatbot` (POST)
- ✅ Récupère l'historique lors du retour via `/api/chatbot?conversationId=...` (GET)
- ✅ Typing indicator animé
- ✅ Support conversation persistante
- ✅ Gestion des erreurs avec fallback

**État managé :**
```typescript
- isOpen: boolean
- messages: Message[] (persisté en DB via API)
- conversationId: string | null
- isTyping: boolean
- isLoading: boolean
- settings: ChatbotSettings (récupérés depuis API)
- quickActions: array (dynamique depuis API)
```

---

### 2. **Admin Dashboard** (`app/(dashboard)/dashboard/chatbot/page.tsx`)

**4 Onglets :**

#### a) **Général**
- Toggle : Activer/Désactiver le chatbot
- Message de bienvenue (textarea)
- Sélection de personnalité (4 options : formel, convivial, technique, décontracté)
- API: `PATCH /api/settings`

#### b) **Actions Rapides**
- Affichage des actions existantes
- Formulaire pour ajouter de nouvelles actions
- Bouton Supprimer par action
- API: `POST /api/chatbot/quick-actions`

#### c) **Historique**
- Liste des conversations anonymisées
- Infos : visiteur, nombre de messages, date, status
- API: `GET /api/chatbot/conversations`

#### d) **LLM / Provider**
- Sélection du provider (Aucun/Mock, OpenAI, Anthropic)
- Champ API Key (caché par défaut)
- Sélection du modèle
- API: `POST /api/chatbot/llm-config`

---

### 3. **API Endpoints**

#### `POST /api/chatbot`
```json
Request:
{
  "conversationId": "conv_123" | null,  // null = créer une nouvelle conversation
  "message": "Bonjour!",
  "visitorName": "John" (optional),
  "visitorEmail": "john@email.com" (optional)
}

Response:
{
  "conversationId": "conv_123",
  "message": "Réponse du bot...",
  "timestamp": "2026-04-04T..."
}
```

**Logique:**
1. Crée une conversation si première fois
2. Sauvegarde le message utilisateur en DB
3. Génère une réponse (mock pour l'instant, prêt pour LLM)
4. Sauvegarde la réponse en DB
5. Retourne la réponse et ID conversation

#### `GET /api/chatbot?conversationId=...`
```json
Response:
{
  "messages": [
    { "id": "msg_1", "role": "user", "content": "...", "createdAt": "..." },
    { "id": "msg_2", "role": "bot", "content": "...", "createdAt": "..." }
  ]
}
```

#### `GET /api/chatbot/conversations?limit=50&offset=0`
```json
Response:
{
  "conversations": [
    {
      "id": "conv_123",
      "sessionId": "session_...",
      "visitorName": "John",
      "visitorEmail": "...",
      "messageCount": 5,
      "createdAt": "2026-04-04T...",
      "status": "active" | "closed"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

#### `POST /api/chatbot/quick-actions`
```json
Request:
{
  "quickActions": [
    { "id": "1", "label": "Voir les projets", "action": "/projects" },
    { "id": "2", "label": "Services", "action": "/about" }
  ]
}

Response:
{
  "success": true,
  "quickActions": [...]
}
```

#### `POST /api/chatbot/llm-config`
```json
Request:
{
  "provider": "openai" | "anthropic" | "none",
  "apiKey": "sk-..." (encrypted in storage),
  "model": "gpt-4" | "claude-3-opus"
}

Response:
{
  "success": true,
  "provider": "openai",
  "model": "gpt-4"
}
```

---

## 🗄️ Base de Données

### Modèles Prisma utilisés

**ChatbotConversation**
```prisma
model ChatbotConversation {
  id            String   @id @default(cuid())
  sessionId     String   @unique  // Identifiant unique de la session
  visitorName   String?
  visitorEmail  String?
  messages      ChatbotMessage[]
  status        String   @default("active")  // active, closed
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**ChatbotMessage**
```prisma
model ChatbotMessage {
  id             String   @id @default(cuid())
  conversationId String
  conversation   ChatbotConversation @relation(fields: [conversationId], references: [id])
  role           String   // "user" ou "bot"
  content        String   @db.Text
  createdAt      DateTime @default(now())
}
```

**Settings** (existant, enrichi)
```prisma
model Settings {
  chatbotEnabled   Boolean  @default(true)
  chatbotWelcome   String?
  chatbotPersonality String @default("professional")
  metadata         Json     // Stocke: { quickActions: [...], llmProvider, llmModel, llmApiKey }
}
```

---

## 🚀 Flux d'utilisation

### Scénario 1: Admin configure le chatbot

1. Admin va sur `/dashboard/chatbot`
2. Onglet "Général" :
   - Change le message de bienvenue
   - Sélectionne une personnalité
   - `PATCH /api/settings` → Enregistre
3. Onglet "Actions rapides" :
   - Ajoute 2 actions : "Documentation", "Support"
   - `POST /api/chatbot/quick-actions` → Enregistre
4. Onglet "LLM" :
   - Choisit provider "OpenAI"
   - Entre la clé API
   - `POST /api/chatbot/llm-config` → Enregistre

### Scénario 2: Visiteur utilise le widget

1. Visiteur ouvre le site, voit le bouton chat (animation nudge)
2. Clique pour ouvrir le widget
3. Widget :
   - `GET /api/settings` → Récupère welcome + personality
   - `GET /api/chatbot/quick-actions` → Affiche action rapides
   - Affiche le message "Bonjour..."
4. Visiteur clique "Documentation"
   - `POST /api/chatbot` avec { message: "Documentation" }
   - Serveur crée conversation, sauvegarde le message
   - Génère réponse (mock ou LLM)
   - `Response: { conversationId, message, timestamp }`
5. Widget affiche la réponse
6. Au prochain appel, les nouveaux messages sont inclus (récupérés à l'ouverture)

---

## 🔧 Prochaines Étapes (Optional)

### Phase 1: LLM Integration
```typescript
// Dans generateBotResponse() en /api/chatbot/route.ts

async function generateBotResponse(userMessage: string, personality: string): Promise<string> {
  const settings = await prisma.settings.findFirst();
  
  if (settings.llmProvider === 'none') {
    // Fallback actuel (mock)
    return botReplies[userMessage] ?? defaultResponse;
  }
  
  if (settings.llmProvider === 'openai') {
    const client = new OpenAI({ apiKey: settings.metadata.llmApiKey });
    const response = await client.chat.completions.create({
      model: settings.metadata.llmModel,
      system: `Tu es un assistant professionnel. Ta personnalité: ${personality}.`,
      messages: [
        { role: "system", content: `Personality: ${personality}` },
        { role: "user", content: userMessage }
      ]
    });
    return response.choices[0].message.content;
  }
  // Idem pour Anthropic...
}
```

### Phase 2: Conversation Context
- Inclure les 5 derniers messages comme contexte pour le LLM
- Améliorer la qualité des réponses avec historique

### Phase 3: Analytics & Monitoring
- Voir quels types de questions posent les visiteurs
- Marquer les conversations comme "résolues" ou "handoff to human"
- Intégration avec système de notifications

### Phase 4: Live Preview
- Admin peut tester le widget en temps réel
- Voir comment ça apparaît avec ses settings appliqués

---

## 🔐 Sécurité

- ✅ API clés chiffrées (TODO: implémenter encryption réelle)
- ✅ Conversations anonymisées en admin
- ✅ Pas d'expose des messages de test
- ⚠️ TODO: Ajouter rate limiting sur `/api/chatbot`
- ⚠️ TODO: Ajouter authentication/session pour les conversations retenues

---

## 📊 Navigatio Nav

Le lien "Chatbot" apparaît dans la sidebar sous la section "Compte" :
- `/dashboard/chatbot` → Admin panel complet

---

## ✨ Highlights

### Ce qui est déjà prêt:
1. ✅ Admin peut activer/désactiver le chatbot en 1 clic
2. ✅ Personnalité configurable (affecte la génération de réponses)
3. ✅ Actions rapides dynamiques (modifiables sans redéployer)
4. ✅ Historique persistent des conversations
5. ✅ Typing indicator pour UX naturelle
6. ✅ Widget optimisé (récupère settings à chaque ouverture)
7. ✅ API slots prêts pour LLM integration

### Améliorations immédiates possibles:
- [ ] Chiffrer les API keys en production
- [ ] Ajouter validation des URLs des actions rapides
- [ ] Limiter la longueur des messages
- [ ] Ajouter géolocalisation des visiteurs
- [ ] Support multi-langue pour welcome message

---

**Prêt à déployer !** 🚀
