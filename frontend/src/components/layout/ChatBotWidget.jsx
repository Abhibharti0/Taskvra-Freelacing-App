import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

async function askAI(messages) {
  try {
    const { data } = await api.post('/ai/chat', { messages });
    return data.reply || "Sorry, I couldn't generate a response.";
  } catch (e) {
    const msg = e.response?.data?.message || e.message;
    if (msg?.includes('AI not configured')) {
      return 'AI is not configured on the server. Please set GROQ_API_KEY in backend .env.';
    }
    return 'Sorry, something went wrong answering that.';
  }
}

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m Taskvra\'s AI assistant. Ask me anything about freelancing.' }
  ]);
  const endRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    const convo = [
      { role: 'system', content: 'You are a helpful freelancing assistant.' },
      ...messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
      { role: 'user', content: text }
    ];
    const reply = await askAI(convo);
    setMessages((m) => [...m, { role: 'bot', text: reply }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Toggle Button */}
      <button
        aria-label={open ? 'Close help chat' : 'Open help chat'}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-linear-to-r from-sky-400 via-indigo-500 to-fuchsia-500 p-3 text-slate-950 shadow-[0_18px_45px_rgba(56,189,248,0.5)] hover:brightness-110 focus:outline-none"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M12 2C6.477 2 2 5.962 2 10.846c0 2.58 1.362 4.899 3.52 6.424-.13.93-.6 2.598-1.933 3.846 0 0 2.225.164 4.154-1.1.8.214 1.644.33 2.519.33 5.523 0 10-3.962 10-8.846S17.523 2 12 2z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-3 w-80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-[0_24px_60px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="text-sm font-semibold text-slate-100">Help Chat</div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Beta</span>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto px-3 py-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${m.role === 'user' ? 'bg-sky-500/20 text-sky-100 border border-sky-500/30' : 'bg-slate-900/70 text-slate-100 border border-slate-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-300">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-slate-800 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
                placeholder="Ask about gigs, bids, messages..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-500/30"
              />
              <button onClick={send} className="rounded-xl bg-sky-500/80 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
