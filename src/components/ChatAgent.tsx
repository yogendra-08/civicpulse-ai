import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
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

const reservedAnswers: Array<{ patterns: string[]; answer: string }> = [
  {
    patterns: ['login', 'sign in', 'password', 'register', 'signup'],
    answer:
      'Use the Login and Register pages to access the portal. Citizens can create an account, while officers and admins sign in with their assigned credentials.',
  },
  {
    patterns: ['forgot password', 'reset password', 'recover password'],
    answer:
      'Open the login page, enter your email, and use the Forgot password option. The app is set up for password reset support through the account flow.',
  },
  {
    patterns: ['complaint', 'report', 'file', 'submit'],
    answer:
      'Citizens can report a complaint from the Report Complaint page. Add the issue details, location, ward, and an optional photo, then submit for AI routing.',
  },
  {
    patterns: ['photo', 'image', 'upload', 'camera'],
    answer:
      'When reporting a complaint, you can attach an image to help explain the issue. The app accepts a photo from your device and previews it before submission.',
  },
  {
    patterns: ['location', 'ward', 'landmark', 'address'],
    answer:
      'Complaint reports work best when you include a clear location, ward, and nearby landmark. That helps routing and follow-up during resolution.',
  },
  {
    patterns: ['track', 'status', 'timeline', 'follow up'],
    answer:
      'Complaint progress is visible in the citizen dashboard and the complaint detail modal. You can see status updates, timelines, and resolution notes there, along with the complaint number.',
  },
  {
    patterns: ['officer', 'assigned', 'workload', 'update status'],
    answer:
      'Officers use the Officer Dashboard to view assigned complaints and move them through Assigned, In Progress, Resolved, and Closed states.',
  },
  {
    patterns: ['citizen dashboard', 'my complaints', 'dashboard'],
    answer:
      'The citizen dashboard shows your complaint list, quick stats, search and filters, and a shortcut to report a new complaint.',
  },
  {
    patterns: ['officer dashboard', 'assigned complaints', 'field officer'],
    answer:
      'The officer dashboard lists complaints assigned to that officer record, with filters, complaint details, and the next status action when available.',
  },
  {
    patterns: ['admin', 'analytics', 'dashboard', 'performance'],
    answer:
      'Admins can view the Admin Dashboard and Analytics pages for department performance, ward trends, severity breakdowns, and complaint statistics.',
  },
  {
    patterns: ['users', 'user management', 'manage users'],
    answer:
      'Admins can open the User Management page to review citizens, officers, and admin accounts. It is intended for oversight and support tasks.',
  },
  {
    patterns: ['profile', 'change name', 'phone', 'address'],
    answer:
      'The Profile page lets citizens update their name, phone number, and address. Ward and email are kept fixed to preserve account records.',
  },
  {
    patterns: ['how to use', 'help', 'what can i do', 'features'],
    answer:
      'CivicPulse lets citizens report issues, track status, and update profile details; officers manage assigned complaints; admins review analytics and users.',
  },
  {
    patterns: ['support', 'contact', 'helpline', 'contact us'],
    answer:
      'The landing page includes the municipal helpline and support details. If you need operational help, start with the support information shown there.',
  },
  {
    patterns: ['gemini', 'ai', 'classification', 'route'],
    answer:
      "The app uses Gemini for conversational help. Complaint classification itself is handled by the app's complaint AI workflow, which can also fall back to local rules.",
  },
  {
    patterns: ['why', 'not working', 'error', 'failed', 'problem'],
    answer:
      'If something is not working, first check that you are signed in with the right role and that your complaint data is complete. If the issue persists, the app may be waiting on Supabase or Gemini configuration.',
  },
];

function localFallbackAnswer(question: string): string {
  const lower = question.toLowerCase();
  const match = reservedAnswers.find(({ patterns }) => patterns.some((p) => lower.includes(p)));
  if (match) return match.answer;
  return "I can help with login, complaint filing, complaint tracking, officer workflows, and admin analytics. Please ask a civic platform question and I'll answer as best I can.";
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
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi, I'm the CivicPulse helper. Ask me about complaints, login, officer workflows, or admin pages.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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
  const assistantLabel = GEMINI_API_KEY ? 'Gemini' : 'Fallback mode';

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
        { id: makeId(), role: 'assistant', content: localFallbackAnswer(question) },
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
                CivicPulse Assistant
              </div>
              <div className="text-[11px] text-navy-200">Powered by {assistantLabel}</div>
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
                  Thinking...
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
              placeholder="Ask a question..."
              className="input min-h-[4.5rem] resize-none text-sm"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400">Press Enter to send, Shift+Enter for a new line</div>
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
        aria-label="Open chat assistant"
      >
        {open ? <ChevronDown className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
