"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getOpsToken, setOpsToken } from "@/lib/admin-store";

/**
 * Visible-but-discreet admin entry in the footer bottom bar.
 * Self-contained: checks session → goes straight to /admin when
 * already unlocked, otherwise opens the passkey modal.
 */
export function FooterAdminButton() {
  const [open, setOpen] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const controls = useAnimationControls();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open ]);

  async function handleClick() {
    try {
      const token = getOpsToken();
      const res = await fetch("/api/admin/session", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { authed?: boolean; token?: string };
      if (data.authed) {
        if (data.token) setOpsToken(data.token);
        window.location.assign("/admin");
        return;
      }
      setOpsToken(null);
    } catch {
      /* fall through to modal */
    }
    setPasskey("");
    setFailed(false);
    setOpen(true);
  }

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
      window.location.assign("/admin");
    } else {
      void fail();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-label="Admin access"
        title="Site admin"
        className="label-mono inline-flex cursor-pointer items-center gap-2 border border-sand/30 bg-transparent px-4 py-2 text-sand/70 transition-colors duration-300 hover:border-sand/70 hover:text-sand"
      >
        <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-clay-light" />
        Admin
      </button>

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
                <p className="mt-2 font-serif text-2xl text-ink">Passkey</p>
                <form onSubmit={submit} className="mt-4">
                  <input
                    ref={inputRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value.replace(/\s/g, ""))}
                    className="field text-center text-2xl tracking-[0.5em] text-ink"
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
    </>
  );
}
