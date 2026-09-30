"use client";

import Link from "next/link";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { ConsoleShell, OverviewPanel, VersionsPanel } from "@/components/ops/console";
import { ContentPanel, FaqPanel, GalleryPanel, NavigationPanel, NewsletterPanel } from "@/components/ops/panels-content";
import { DesignPanel, MediaPanel, SettingsPanel } from "@/components/ops/panels-design";
import { AgentsPanel, ModelsPanel } from "@/components/ops/panels-agents";
import { SocialPanel } from "@/components/ops/panels-social";
import { PartnersPanel } from "@/components/ops/panels-partners";
import { LogoPanel } from "@/components/ops/panels-logo";
import { consumeHashToken, getOpsToken, isFramed, setOpsToken, useOpsStore } from "@/lib/admin-store";

export const dynamic = "force-dynamic";

function LockedLogin() {
  const { setSession } = useOpsStore();
  const [passkey, setPasskey] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [framed, setFramed] = useState(false);
  const controls = useAnimationControls();

  useEffect(() => {
    setFramed(isFramed());
  }, []);

  async function fail() {
    setFailed(true);
    setPasskey("");
    await controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
    controls.set({ x: 0 });
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
      setSession({ authed: true, checked: true });
    } else {
      void fail();
    }
  }

  return (
    <div className="ops-root flex min-h-screen items-center justify-center p-6">
      <motion.div
        animate={controls}
        className="w-full max-w-sm border border-white/15 bg-black/40 p-8 text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-300/80">Palawan Collective</p>
        <p className="mt-2 font-mono text-2xl text-white">OPS CONSOLE</p>
        <p className="label-mono mt-4 text-stone-400">Enter passkey to unlock</p>
        <form onSubmit={submit} className="mt-4">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={passkey}
            onChange={(e) => setPasskey(e.target.value.replace(/\s/g, ""))}
            aria-label="Passkey"
            placeholder="••••"
            className="ops-inp text-center text-2xl tracking-[0.5em]"
          />
          <button
            type="submit"
            disabled={busy || !passkey}
            className="mt-4 w-full bg-amber-400 py-3 font-mono text-[13px] uppercase tracking-[0.2em] text-stone-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {busy ? "Checking…" : "Unlock console"}
          </button>
        </form>
        {failed && (
          <p role="alert" className="mt-4 font-mono text-[12px] text-red-300">
            Incorrect passkey — try again.
          </p>
        )}
        {framed && (
          <div className="mt-5 border border-amber-300/30 bg-amber-400/10 p-3">
            <p className="font-mono text-[11px] leading-relaxed text-amber-200">
              Embedded preview detected — if login loops here, open the console in its own tab:
            </p>
            <button
              type="button"
              onClick={() => window.open(window.location.href, "_blank", "noopener")}
              className="mt-2 w-full border border-amber-300/50 py-2 font-mono text-[12px] uppercase tracking-[0.15em] text-amber-200 transition-colors hover:bg-amber-400/20"
            >
              Open console in new tab ↗
            </button>
          </div>
        )}
        <Link
          href="/"
          className="mt-6 inline-block font-mono text-[12px] uppercase tracking-[0.15em] text-stone-500 hover:text-white"
        >
          ← Back to the site
        </Link>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  const { session, setSession } = useOpsStore();

  useEffect(() => {
    // Pick up a token carried in the URL hash (e.g. after login navigation
    // from the footer modal when all storage is blocked).
    consumeHashToken();
    const token = getOpsToken();
    fetch("/api/admin/session", {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => r.json())
      .then((d: { authed?: boolean; token?: string }) => {
        if (d.authed && d.token) setOpsToken(d.token);
        if (!d.authed) setOpsToken(null);
        setSession({ authed: d.authed === true, checked: true });
      })
      .catch(() => setSession({ authed: false, checked: true }));
  }, [setSession]);

  if (!session.checked) {
    return (
      <div className="ops-root flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-mono text-[13px] uppercase tracking-[0.2em] text-stone-500">Verifying session…</p>
      </div>
    );
  }

  if (!session.authed) return <LockedLogin />;

  return (
    <ConsoleShell>
      {(view) => {
        switch (view) {
          case "overview":
            return <OverviewPanel />;
          case "content":
            return <ContentPanel />;
          case "design":
            return <DesignPanel />;
          case "media":
            return <MediaPanel />;
          case "navigation":
            return <NavigationPanel />;
          case "newsletter":
            return <NewsletterPanel />;
          case "faq":
            return <FaqPanel />;
          case "gallery":
            return <GalleryPanel />;
          case "agents":
            return <AgentsPanel />;
          case "models":
            return <ModelsPanel />;
          case "social":
            return <SocialPanel />;
          case "logo":
            return <LogoPanel />;
          case "partners":
            return <PartnersPanel />;
          case "settings":
            return (
              <>
                <SettingsPanel />
                <div className="mt-5">
                  <VersionsPanel />
                </div>
              </>
            );
        }
      }}
    </ConsoleShell>
  );
}
