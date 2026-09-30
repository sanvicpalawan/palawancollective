"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminUrlWithToken, getOpsToken, setOpsToken } from "@/lib/admin-store";

/**
 * Stealth entry: triple-click the element marked [data-ops-trigger]
 * (the site logo) within 700ms. Backup to the footer admin button.
 */
export function StealthLogin() {
  const [open, setOpen] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const controls = useAnimationControls();
  const clicks = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const trigger = useCallback(async () => {
    try {
      const token = getOpsToken();
      const res = await fetch("/api/admin/session", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { authed?: boolean; token?: string };
      if (data.authed) {
        if (data.token) setOpsToken(data.token);
        window.location.assign(adminUrlWithToken());
        return;
      }
      setOpsToken(null);
    } catch {
      /* fall through to modal */
    }
    setPasskey("");
    setFailed(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = event.target as HTMLElement | null;
      if (!el?.closest?.("[data-ops-trigger]")) return;
      const now = Date.now();
      clicks.current = [...clicks.current.filter((t) => now - t < 700), now];
      if (clicks.current.length >= 3) {
        clicks.current = [];
        event.preventDefault();
        event.stopPropagation();
        void trigger();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [trigger]);

  useEffect(() => {
    const onAccess = () => void trigger();
    window.addEventListener("pc:ops-access", onAccess);
    return () => window.removeEventListener("pc:ops-access", onAccess);
  }, [trigger]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open ]);

  async function fail() {
    setFailed(true);
    setPasskey("");
    await controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
    controls.set({ x: 0 });
    inputRef.current?.focus();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !passkey.trim()) return;
    setBusy(true);
    setFailed(false);
    let ok = false;
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ passkey: passkey.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string };
      ok = data.ok === true;
      if (ok && data.token) setOpsToken(data.token);
    } catch {
      ok = false;
    }
    setBusy(false);
    if (ok) {
      window.location.assign(adminUrlWithToken());
    } else {
      void fail();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 p-5 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Operator access"
        >
          <motion.div
            initial={{ y: 14, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={controls}
              className="rounded-[var(--pc-radius,18px)] border border-ink/20 bg-paper p-6 shadow-[var(--pc-shadow)]"
            >
              <p className="label-mono text-clay-deep">Operator access</p>
              <p className="mt-2 font-serif text-2xl">Passkey</p>
              <form onSubmit={submit} className="mt-4">
                <input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value.replace(/\s/g, ""))}
                  className="field text-center text-2xl tracking-[0.5em]"
                  aria-label="Passkey"
                />
                <button
                  type="submit"
                  disabled={busy || !passkey}
                  className="label-mono mt-5 w-full bg-ink py-3 text-sand transition-colors hover:bg-clay-deep disabled:opacity-60"
                >
                  {busy ? "Checking…" : "Unlock"}
                </button>
              </form>
              {failed && (
                <p role="alert" className="mt-3 text-center text-[13px] text-clay-deep">
                  Incorrect passkey — try again.
                </p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
