"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";

interface Message {
  id: number;
  role: "bot" | "user";
  content: string;
}

const quickActions = ["Voir les projets", "Services", "Tarifs"];

const botReplies: Record<string, string> = {
  "Voir les projets":
    "Voici une selection de mes projets recents : applications mobiles, plateformes e-commerce, design systems et dashboards. Voulez-vous voir les details ?",
  Services:
    "Je propose du UX/UI Design, du developpement Frontend (Next.js, React), et de la creation d'identite visuelle. Quel service vous interesse ?",
  Tarifs:
    "Mes tarifs varient selon la complexite du projet. Contactez-moi via le formulaire pour obtenir un devis personnalise.",
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "bot",
    content:
      "Bonjour ! Je suis l'assistant de Max. Comment puis-je vous aider ?",
  },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: content.trim(),
    };

    const reply =
      botReplies[content.trim()] ??
      "Merci pour votre message. Max vous repondra tres prochainement. En attendant, n'hesitez pas a utiliser le formulaire de contact.";

    const botMessage: Message = {
      id: Date.now() + 1,
      role: "bot",
      content: reply,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[400px] bg-white rounded-2xl border border-neutral-200 overflow-hidden animate-scale-in">
          <div className="bg-primary-500 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12" height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white leading-none">Max Assistant</p>
              <p className="text-xs text-white/80 mt-0.5">En ligne · Repond instantanement</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-200"
              aria-label="Fermer le chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-10">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => sendMessage(action)}
                    className="bg-white border border-primary-300 text-primary-600 px-3 py-1.5 rounded-full text-sm hover:bg-primary-50 transition-colors duration-200"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-3 py-3 border-t border-neutral-100 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-colors duration-200"
            />
            <button
              type="submit"
              className="w-9 h-9 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 shrink-0"
              aria-label="Envoyer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "relative w-14 h-14 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white transition-all duration-200",
          !isOpen ? "chatbot-nudge" : "",
        ].join(" ")}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {!isOpen && (
          <>
            <span className="chatbot-badge-ping" aria-hidden="true" />
          </>
        )}
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      <style>{`
        .chatbot-nudge {
          animation: chatbot-nudge 4.6s ease-in-out infinite;
          box-shadow: 0 10px 24px rgba(59, 130, 246, 0.26);
        }

        .chatbot-badge-ping {
          position: absolute;
          top: 1px;
          right: 1px;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          animation: chatbot-ping 1.5s ease-out infinite;
          pointer-events: none;
        }

        @keyframes chatbot-nudge {
          0%, 58%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          62% {
            transform: translateX(-4px) rotate(-7deg);
          }
          68% {
            transform: translateX(4px) rotate(7deg);
          }
          74% {
            transform: translateX(-3px) rotate(-5deg);
          }
          80% {
            transform: translateX(3px) rotate(5deg);
          }
        }

        @keyframes chatbot-ping {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          35% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: scale(1.35);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .chatbot-nudge,
          .chatbot-badge-ping {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
