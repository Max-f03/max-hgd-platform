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
}

interface ChatWidgetProps {
  enabled?: boolean;
  welcomeMessage?: string;
  primaryColor?: string;
  quickActions?: QuickAction[];
}

export default function ChatWidget({
  enabled = true,
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
    void sendMessage(action.message);
  };

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
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              borderColor: "var(--ui-border)",
              background: "var(--ui-card)",
              color: "var(--ui-text)",
            }}
          >
            <div
              className="flex items-center justify-between p-4 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Assistant Max</h3>
                  <p className="text-xs text-white/80">En ligne</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer le chatbot"
                className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'rounded-br-md text-white'
                          : 'rounded-bl-md'
                      }`}
                      style={
                        message.role === 'user'
                          ? { backgroundColor: primaryColor }
                          : { background: 'var(--ui-input-bg)', color: 'var(--ui-text)' }
                      }
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>

                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.actions.map((action, index) => (
                          <a
                            key={index}
                            href={action.url}
                            target={action.url.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = primaryColor;
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = primaryColor;
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

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ background: 'var(--ui-input-bg)' }}>
                    <div className="flex gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--ui-text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--ui-text-muted)' }}>
                        Assistant en train d\'ecrire...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && quickActions.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={`${action.label}-${index}`}
                      onClick={() => handleQuickAction(action)}
                      aria-label={`Action rapide: ${action.label}`}
                      className="rounded-full border px-3 py-2 text-xs font-medium text-white transition-colors"
                      style={{
                        borderColor: primaryColor,
                        backgroundColor: primaryColor,
                        color: '#ffffff',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="border-t p-4"
              style={{ borderColor: 'var(--ui-border)' }}
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
                  className="h-11 flex-1 rounded-full border px-4 transition-colors focus:outline-none"
                  style={{
                    borderColor: 'var(--ui-border)',
                    background: 'var(--ui-input-bg)',
                    color: 'var(--ui-text)',
                  }}
                />
                <button
                  type="submit"
                  aria-label="Envoyer le message"
                  disabled={!input.trim() || isLoading}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
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
