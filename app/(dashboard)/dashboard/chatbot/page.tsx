'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, MessageSquare, Zap, Settings as SettingsIcon, Clock3, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AdminCard from '@/components/dashboard/AdminCard';

interface ChatbotSettings {
  id: string;
  enabled: boolean;
  welcome: string;
  personality: 'professional' | 'friendly' | 'technical' | 'casual';
  quickActions?: Array<{ id: string; label: string; action: string }>;
  llmProvider?: 'openai' | 'anthropic' | 'none';
  llmApiKey?: string;
  llmModel?: string;
}

interface Conversation {
  id: string;
  sessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  messageCount: number;
  createdAt: string;
  status: 'active' | 'closed';
}

type Tab = 'general' | 'actions' | 'history' | 'llm';

const PERSONALITY_OPTIONS: Array<{ value: ChatbotSettings['personality']; label: string; icon: string }> = [
  { value: 'professional', label: 'Formel', icon: '📊' },
  { value: 'friendly', label: 'Convivial', icon: '😊' },
  { value: 'technical', label: 'Technique', icon: '⚙️' },
  { value: 'casual', label: 'Décontracté', icon: '💬' },
];

const DEFAULT_QUICK_ACTIONS = [
  { id: '1', label: 'Voir les projets', action: '/projects' },
  { id: '2', label: 'Services', action: '/about' },
  { id: '3', label: 'Tarifs', action: '/contact' },
];

export default function ChatbotAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings state
  const [settings, setSettings] = useState<ChatbotSettings>({
    id: '',
    enabled: true,
    welcome: 'Bonjour! Comment puis-je vous aider?',
    personality: 'professional',
    quickActions: DEFAULT_QUICK_ACTIONS,
    llmProvider: 'none',
    llmApiKey: '',
    llmModel: 'gpt-4',
  });

  // Quick actions form state
  const [newActionLabel, setNewActionLabel] = useState('');
  const [newActionUrl, setNewActionUrl] = useState('');

  // LLM form state
  const [llmApiKey, setLlmApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to load settings');
        const data = await response.json();

        setSettings((prev) => ({
          ...prev,
          enabled: data.chatbotEnabled ?? true,
          welcome: data.chatbotWelcome ?? 'Bonjour! Comment puis-je vous aider?',
          personality: data.chatbotPersonality ?? 'professional',
        }));
        setLlmApiKey(data.llmApiKey ?? '');
      } catch (err) {
        setError('Erreur lors du chargement des paramètres');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Load conversations
  const loadConversations = async () => {
    if (activeTab !== 'history' || conversationsLoading) return;

    setConversationsLoading(true);
    try {
      const response = await fetch('/api/chatbot/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadConversations();
    }
  }, [activeTab]);

  // Save general settings
  const handleSaveGeneral = async () => {
    try {
      setError('');
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotEnabled: settings.enabled,
          chatbotWelcome: settings.welcome,
          chatbotPersonality: settings.personality,
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      setSuccess('Paramètres sauvegardés avec succès!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    }
  };

  // Add quick action
  const handleAddAction = () => {
    if (!newActionLabel || !newActionUrl) return;

    const newAction = {
      id: Date.now().toString(),
      label: newActionLabel,
      action: newActionUrl,
    };

    setSettings((prev) => ({
      ...prev,
      quickActions: [...(prev.quickActions || []), newAction],
    }));

    setNewActionLabel('');
    setNewActionUrl('');
  };

  // Remove quick action
  const handleRemoveAction = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      quickActions: (prev.quickActions || []).filter((action) => action.id !== id),
    }));
  };

  // Save quick actions
  const handleSaveActions = async () => {
    try {
      setError('');
      const response = await fetch('/api/chatbot/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickActions: settings.quickActions,
        }),
      });

      if (!response.ok) throw new Error('Failed to save quick actions');
      setSuccess('Actions rapides sauvegardées!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    }
  };

  // Save LLM settings
  const handleSaveLLM = async () => {
    try {
      setError('');
      const response = await fetch('/api/chatbot/llm-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.llmProvider,
          apiKey: llmApiKey,
          model: settings.llmModel,
        }),
      });

      if (!response.ok) throw new Error('Failed to save LLM config');
      setSuccess('Configuration LLM sauvegardée!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" style={{ animation: 'reveal-up 0.7s ease-out both' }}>
      <div className="rounded-[28px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#eff6ff_35%,#f8fbff_85%)] p-4 sm:p-5 lg:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white/95">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700/80">Chatbot center</p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">Configuration Chatbot</h1>
                <p className="mt-1.5 text-sm text-slate-500">Gérez votre assistant interactif et ses paramètres.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Statut</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{settings.enabled ? 'ON' : 'OFF'}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Personnalité</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{PERSONALITY_OPTIONS.find((p) => p.value === settings.personality)?.label || 'Formel'}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Conversations</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{conversations.length}</p>
              </div>
            </div>
          </AdminCard>

          <div className="rounded-3xl border border-blue-200 bg-[linear-gradient(145deg,#0f3dbe_0%,#1550d7_45%,#2b6ff0_100%)] p-6 text-white shadow-[0_16px_36px_rgba(37,99,235,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">Live status</p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">{conversations.filter((c) => c.status === 'active').length} conversations actives</h3>
            <p className="mt-2 text-sm leading-6 text-blue-100/90">Suivi des interactions et des réglages en temps réel.</p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <div className="inline-flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <p className="font-medium">{success}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <AdminCard padding="md" className="rounded-3xl border-blue-100 bg-white">
      <div className="flex flex-wrap gap-2">
        {[
          { tab: 'general' as Tab, label: 'Général', icon: SettingsIcon },
          { tab: 'actions' as Tab, label: 'Actions rapides', icon: Zap },
          { tab: 'history' as Tab, label: 'Historique', icon: Clock3 },
          { tab: 'llm' as Tab, label: 'LLM / Provider', icon: MessageSquare },
        ].map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition"
            style={{
              background: activeTab === tab ? 'var(--ui-status-info-bg)' : 'var(--ui-input-bg)',
              color: activeTab === tab ? 'var(--ui-status-info-text)' : 'var(--ui-text-secondary)',
              border: '1px solid var(--ui-border)',
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      </AdminCard>

      {/* TAB: GENERAL */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Paramètres généraux</h2>

            {/* Enable/Disable */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border border-blue-200 accent-blue-600"
                />
                <span className="text-slate-700">
                  Chatbot {settings.enabled ? 'activé' : 'désactivé'}
                </span>
              </label>
            </div>

            {/* Welcome Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message de bienvenue
              </label>
              <textarea
                value={settings.welcome}
                onChange={(e) => setSettings({ ...settings, welcome: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-300 resize-none"
                rows={3}
                placeholder="Votre message d'accueil..."
              />
              <p className="text-xs text-slate-500 mt-2">Affiché à l'ouverture du widget</p>
            </div>

            {/* Personality */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Personnalité du chatbot
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PERSONALITY_OPTIONS.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setSettings({ ...settings, personality: value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.personality === value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-100 bg-white hover:border-blue-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-xs text-slate-700">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveGeneral}
              className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition hover:brightness-105"
            >
              Enregistrer les modifications
            </Button>
          </AdminCard>
        </div>
      )}

      {/* TAB: QUICK ACTIONS */}
      {activeTab === 'actions' && (
        <div className="space-y-6">
          <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Boutons d'action rapide</h2>
            <p className="text-sm text-slate-500 mb-6">
              Personnalisez les actions qui apparaissent dans le widget
            </p>

            {/* Current Actions */}
            <div className="mb-8 space-y-3">
              {(settings.quickActions || []).map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 bg-slate-50/70 border border-blue-100 rounded-lg"
                >
                  <div>
                    <p className="text-slate-900 font-medium">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.action}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveAction(action.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Action */}
            <div className="border-t border-blue-100 pt-6">
              <h3 className="font-medium text-slate-900 mb-4">Ajouter une nouvelle action</h3>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Libellé</label>
                  <Input
                    value={newActionLabel}
                    onChange={(e) => setNewActionLabel(e.target.value)}
                    placeholder="ex: Voir les projets"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">URL ou action</label>
                  <Input
                    value={newActionUrl}
                    onChange={(e) => setNewActionUrl(e.target.value)}
                    placeholder="ex: /projects"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddAction}
                className="w-full bg-white hover:bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center gap-2 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Ajouter l'action
              </Button>
            </div>

            <Button
              onClick={handleSaveActions}
              className="w-full mt-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition hover:brightness-105"
            >
              Enregistrer les actions
            </Button>
          </AdminCard>
        </div>
      )}

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Historique des conversations</h2>
            <p className="text-sm text-slate-500 mb-6">
              {conversations.length} conversation(s) trouvée(s)
            </p>

            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucune conversation enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-4 bg-slate-50/70 border border-blue-100 rounded-lg hover:bg-blue-50/70 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-slate-900 font-medium">
                        {conv.visitorName || 'Visiteur anonyme'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>{conv.messageCount} messages</span>
                        <span>{new Date(conv.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span className={`px-2 py-1 rounded ${
                          conv.status === 'active'
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {conv.status === 'active' ? 'Active' : 'Fermée'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      )}

      {/* TAB: LLM / PROVIDER */}
      {activeTab === 'llm' && (
        <div className="space-y-6">
          <AdminCard padding="lg" className="rounded-3xl border-blue-100 bg-white">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Configuration LLM / Provider</h2>

            {/* Provider Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Provider LLM
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'none', label: 'Aucun (Mock)', desc: 'Réponses pré-définies' },
                  { value: 'openai', label: 'OpenAI', desc: 'GPT-4 / 3.5' },
                  { value: 'anthropic', label: 'Anthropic', desc: 'Claude' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setSettings({ ...settings, llmProvider: value as any })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      settings.llmProvider === value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-100 bg-white hover:border-blue-200'
                    }`}
                  >
                    <div className="font-medium text-slate-900">{label}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {settings.llmProvider !== 'none' && (
              <>
                {/* API Key */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Clé API
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={llmApiKey}
                      onChange={(e) => setLlmApiKey(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-blue-100 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-300"
                      placeholder="sk-..."
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                    >
                      {showApiKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Votre clé API est chiffrée et jamais exposée au client
                  </p>
                </div>

                {/* Model Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Modèle
                  </label>
                  <select
                    value={settings.llmModel || 'gpt-4'}
                    onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-blue-100 rounded-lg text-slate-900 focus:outline-none focus:border-blue-300"
                  >
                    {settings.llmProvider === 'openai' && (
                      <>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    )}
                    {settings.llmProvider === 'anthropic' && (
                      <>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
                  <p className="text-sm text-blue-900">
                    💡 Assurez-vous que votre clé API a les permissions nécessaires et que votre provider est configuré.
                  </p>
                </div>
              </>
            )}

            <Button
              onClick={handleSaveLLM}
              className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition hover:brightness-105"
            >
              Enregistrer la configuration
            </Button>
          </AdminCard>
        </div>
      )}
    </div>
  );
}
