'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';

interface ActionButton {
  label: string;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  actions?: ActionButton[];
}

interface QuickAction {
  label: string;
  message: string;
  url?: string;
}

interface ChatWidgetProps {
  enabled?: boolean;
  botName?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  quickActions?: QuickAction[];
}

export default function ChatWidget({
  enabled = true,
  botName = 'Assistant',
  welcomeMessage =
    "Bonjour ! Je suis l'assistant de Max. Comment puis-je vous aider ?",
  primaryColor = '#3B82F6',
  quickActions = [
    { label: 'Voir les projets', message: 'Je voudrais voir vos projets' },
    { label: 'Services', message: 'Quels services proposez-vous ?' },
    { label: 'Contact', message: 'Je voudrais vous contacter' },
  ],
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          createdAt: new Date(),
        },
      ]);
    }
  }, [isOpen, welcomeMessage, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), sessionId }),
      });

      const data = (await response.json()) as { error?: string; message?: string; actions?: ActionButton[] };
      if (data.error || !data.message) {
        throw new Error(data.error || 'Invalid chatbot response');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        createdAt: new Date(),
        actions: data.actions ?? [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Desole, une erreur s\'est produite. Veuillez reessayer.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.url) {
      const url = action.url.trim();
      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
      return;
    }
    void sendMessage(action.message);
  };

  const panelHeightClass =
    messages.length <= 1
      ? 'h-[min(340px,calc(100svh-5rem))]'
      : 'h-[min(400px,calc(100svh-5rem))]';

  if (!enabled) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le chatbot"
            className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full shadow-[0_16px_30px_rgba(15,23,42,0.22)] ring-1 ring-white/20 transition-transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`,
            }}
          >
            <MessageCircle className="h-4.5 w-4.5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-4 right-3 sm:right-4 z-50 flex ${panelHeightClass} w-[calc(100vw-1.2rem)] max-w-[320px] flex-col overflow-hidden rounded-[22px] border shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl`}
            style={{
              borderColor: "rgba(148,163,184,0.18)",
              background: "linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.98) 100%)",
              color: "var(--ui-text)",
            }}
          >
            <div
              className="flex items-center justify-between border-b border-white/10 p-3 text-white"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold leading-none">{botName}</h3>
                  <p className="mt-0.5 text-[11px] text-white/80">En ligne</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer le chatbot"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-3 pt-3 pb-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="max-w-[88%]">
                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        message.role === 'user'
                          ? 'rounded-br-md text-white'
                          : 'rounded-bl-md'
                      }`}
                      style={
                        message.role === 'user'
                          ? { backgroundColor: primaryColor }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.92)' }
                      }
                    >
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message.content}</p>
                    </div>

                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.actions.map((action, index) => (
                          <a
                            key={index}
                            href={action.url}
                            target={action.url.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            aria-label={`Ouvrir l'action ${action.label}`}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white transition-colors"
                            style={{
                              borderColor: 'rgba(255,255,255,0.12)',
                              background: 'rgba(255,255,255,0.08)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            }}
                          >
                            {action.label}
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {messages.length <= 1 && quickActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickActions.map((action, index) => (
                    <button
                      key={`${action.label}-${index}`}
                      onClick={() => handleQuickAction(action)}
                      aria-label={`Action rapide: ${action.label}`}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                      <span className="text-[11px] text-white/60">
                        Assistant en train d&apos;ecrire...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-white/10 p-2.5"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Votre message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ecrivez votre message..."
                  disabled={isLoading}
                  className="h-9 flex-1 rounded-full border border-white/10 px-3 text-[12px] transition-colors focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                />
                <button
                  type="submit"
                  aria-label="Envoyer le message"
                  disabled={!input.trim() || isLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}D0)` }}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
