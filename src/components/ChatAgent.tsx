import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const STORAGE_KEY = 'civicpulse.chatagent.open';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || 'gemini-1.5-flash';

const reservedAnswerKeys: Array<{ patterns: string[]; key: string }> = [
  { patterns: ['login', 'sign in', 'password', 'register', 'signup'], key: 'chat.answers.login' },
  { patterns: ['forgot password', 'reset password', 'recover password'], key: 'chat.answers.forgotPassword' },
  { patterns: ['complaint', 'report', 'file', 'submit'], key: 'chat.answers.complaint' },
  { patterns: ['photo', 'image', 'upload', 'camera'], key: 'chat.answers.photo' },
  { patterns: ['location', 'ward', 'landmark', 'address'], key: 'chat.answers.location' },
  { patterns: ['track', 'status', 'timeline', 'follow up'], key: 'chat.answers.track' },
  { patterns: ['officer', 'assigned', 'workload', 'update status'], key: 'chat.answers.officer' },
  { patterns: ['citizen dashboard', 'my complaints', 'dashboard'], key: 'chat.answers.citizenDashboard' },
  { patterns: ['officer dashboard', 'assigned complaints', 'field officer'], key: 'chat.answers.officerDashboard' },
  { patterns: ['admin', 'analytics', 'dashboard', 'performance'], key: 'chat.answers.admin' },
  { patterns: ['users', 'user management', 'manage users'], key: 'chat.answers.users' },
  { patterns: ['profile', 'change name', 'phone', 'address'], key: 'chat.answers.profile' },
  { patterns: ['how to use', 'help', 'what can i do', 'features'], key: 'chat.answers.features' },
  { patterns: ['support', 'contact', 'helpline', 'contact us'], key: 'chat.answers.support' },
  { patterns: ['gemini', 'ai', 'classification', 'route'], key: 'chat.answers.ai' },
  { patterns: ['why', 'not working', 'error', 'failed', 'problem'], key: 'chat.answers.troubleshoot' },
];

function localFallbackAnswer(question: string, t: (key: string) => string): string {
  const lower = question.toLowerCase();
  const match = reservedAnswerKeys.find(({ patterns }) => patterns.some((p) => lower.includes(p)));
  if (match) return t(match.key);
  return t('chat.localFallback');
}

async function askGemini(question: string, history: ChatMessage[]): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Missing Gemini API key');

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text:
            'You are the CivicPulse AI assistant. Answer clearly and concisely using only what is visible in the app or generally safe civic-portal guidance. If the question is outside the app, say you are not sure and keep the answer brief.',
        },
      ],
    },
    ...history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 256,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('').trim();

  if (!text) throw new Error('Gemini returned no answer');
  return text;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatAgent() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([{ id: 'welcome', role: 'assistant', content: t('chat.welcome') }]);
  }, [i18n.language, t]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setOpen(stored === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const canSend = message.trim().length > 0 && !loading;
  const assistantLabel = GEMINI_API_KEY ? 'Gemini' : t('chat.fallbackMode');

  async function handleSend() {
    const question = message.trim();
    if (!question || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { id: makeId(), role: 'user', content: question },
    ];
    setMessages(nextMessages);
    setMessage('');
    setLoading(true);

    try {
      const answer = await askGemini(question, nextMessages);
      setMessages((prev) => [...prev, { id: makeId(), role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: 'assistant', content: localFallbackAnswer(question, t) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      {open ? (
        <div className="mb-3 w-[min(92vw,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-navy-900 px-4 py-3 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-saffron-400" />
                {t('app.assistant')}
              </div>
              <div className="text-[11px] text-navy-200">{t('chat.poweredBy', { provider: assistantLabel })}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-navy-200 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={viewportRef} className="max-h-[26rem] space-y-3 overflow-y-auto px-3 py-3 scrollbar-thin">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-gov-600 text-white' : 'bg-slate-100 text-navy-800'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('chat.thinking')}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder={t('chat.askPlaceholder')}
              className="input min-h-[4.5rem] resize-none text-sm"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400">{t('chat.enterHint')}</div>
              <button onClick={handleSend} disabled={!canSend} className="btn-primary px-3 py-2 text-sm">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-white shadow-xl transition hover:bg-navy-800"
        aria-label={t('chat.open')}
      >
        {open ? <ChevronDown className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
