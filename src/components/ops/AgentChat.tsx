"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "./Runtime";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = ["Can I stay at Site 01?", "How do I get to El Nido?", "What do you build?"];

export function AgentChat() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState("Palawan Operator");
  const [greeting, setGreeting] = useState("Hi — I run the front desk here. Ask about the builds, the stories, or getting around Palawan.");
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/public/site")
      .then((r) => r.json())
      .then((d: { settings?: Record<string, unknown> }) => {
        const s = d.settings ?? {};
        if (s.chat_enabled === false) setEnabled(false);
        if (typeof s.chat_title === "string" && s.chat_title) setTitle(s.chat_title);
        if (typeof s.chat_greeting === "string" && s.chat_greeting) setGreeting(s.chat_greeting);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  if (pathname?.startsWith("/admin") || !enabled) return null;

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const next = [...msgs, { role: "user" as const, content: message }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    trackEvent("chat", pathname || "/", { kind: "ask" });
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: next.slice(-9, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; reply?: string; provider?: string; model?: string; fallback?: boolean; error?: string };
      const reply = data.ok && data.reply ? data.reply : (data.error ?? "The operator lost signal. Try again in a minute — or message us on WhatsApp.");
      setMsgs([...next, { role: "assistant", content: reply }]);
      setMeta(data.provider ? `${data.provider}${data.model ? ` · ${data.model.split("/").pop()}` : ""}${data.fallback ? " · field-brief mode" : ""}` : null);
    } catch {
      setMsgs([...next, { role: "assistant", content: "The operator lost signal. Try again in a minute — or message us on WhatsApp." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="flex h-[min(540px,calc(100vh-7rem))] w-[370px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-ink/20 bg-paper shadow-[var(--pc-shadow)]"
            role="dialog"
            aria-label={title}
          >
            <div className="flex items-center gap-3 border-b border-ink/15 bg-ink px-4 py-3 text-sand">
              <span className="pulse-dot h-2 w-2 rounded-full bg-clay-light" />
              <div className="min-w-0 flex-1">
                <p className="label-mono text-sand">{title}</p>
                <p className="truncate font-mono text-[10px] text-sand/60">{meta ?? "on duty · replies instantly"}</p>
              </div>
              <button onClick={() => setOpen(false)} className="label-mono px-2 py-1 text-sand/70 hover:text-sand" aria-label="Close chat">
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-ink/15 bg-sand px-3.5 py-2.5 text-[14px] leading-relaxed">
                {greeting}
              </div>
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] bg-ink px-3.5 py-2.5 text-[14px] leading-relaxed text-sand"
                      : "max-w-[88%] border border-ink/15 bg-sand px-3.5 py-2.5 text-[14px] leading-relaxed"
                  }
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <div className="flex w-fit gap-1.5 border border-ink/15 bg-sand px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-ink"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => void send(q)}
                    className="rounded-full border border-ink/20 px-3 py-1.5 font-mono text-[11px] text-ink-2 transition-colors hover:border-ink hover:text-ink"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2 border-t border-ink/15 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Palawan…"
                aria-label="Message the operator"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[14px] outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="label-mono shrink-0 bg-clay px-4 py-2.5 text-sand transition-colors hover:bg-clay-deep disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? "Close operator chat" : "Chat with the Palawan operator"}
        aria-expanded={open}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink text-sand shadow-[var(--pc-shadow)] transition-colors hover:bg-clay-deep"
      >
        <span className="pulse-dot absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-sand bg-moss" />
        {open ? (
          <span className="text-lg" aria-hidden="true">↓</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
            <path d="M4 5.5h16v10H9.5L4 19.5z" />
            <path d="M8 9.5h8M8 12.5h5" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}
