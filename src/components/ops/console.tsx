"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getOpsToken, opsFetch, opsJson, setOpsToken, useOpsStore, type OpsView } from "@/lib/admin-store";

/* ------------------------------------------------------------------ */
/* Atoms                                                                 */
/* ------------------------------------------------------------------ */

export function Panel({ title, sub, right, children }: { title: string; sub?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="ops-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-mono text-[13px] uppercase tracking-[0.18em] text-amber-100/90">{title}</h2>
          {sub && <p className="mt-1 text-[13px] text-stone-400">{sub}</p>}
        </div>
        {right}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function F({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-[12px] text-stone-500">{hint}</span>}
    </label>
  );
}

export function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ops-inp ${props.className ?? ""}`} />;
}

export function Txt(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`ops-inp min-h-24 leading-relaxed ${props.className ?? ""}`} />;
}

export function Sel(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`ops-inp ${props.className ?? ""}`} />;
}

export function Tog({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ?? "Toggle"}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-stone-600"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export function Btn({
  children,
  onClick,
  kind = "ghost",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "ghost" | "danger" | "ok";
  disabled?: boolean;
  title?: string;
}) {
  const styles =
    kind === "primary"
      ? "bg-amber-400 text-stone-950 hover:bg-amber-300"
      : kind === "danger"
        ? "border border-red-400/40 text-red-300 hover:bg-red-500/15"
        : kind === "ok"
          ? "border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/15"
          : "border border-white/15 text-stone-200 hover:border-white/35 hover:text-white";
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3.5 py-2 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Dot({ on, color }: { on?: boolean; color?: string }) {
  const c = color ?? (on ? "bg-emerald-400" : "bg-stone-500");
  return <span className={`inline-block h-2 w-2 rounded-full ${c} ${on ? "pulse-dot" : ""}`} />;
}

export function Empty({ text }: { text: string }) {
  return <p className="border border-dashed border-white/15 px-4 py-8 text-center font-mono text-[12px] text-stone-500">{text}</p>;
}

export function timeShort(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const mins = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/* ------------------------------------------------------------------ */
/* Shell                                                                 */
/* ------------------------------------------------------------------ */

const NAV: Array<{ view: OpsView; label: string; code: string }> = [
  { view: "overview", label: "Overview", code: "00" },
  { view: "images", label: "Site images", code: "01" },
  { view: "content", label: "Content builder", code: "02" },
  { view: "stories", label: "Stories", code: "03" },
  { view: "built", label: "Built", code: "04" },
  { view: "palawan", label: "Palawan", code: "05" },
  { view: "systems", label: "Systems", code: "06" },
  { view: "work", label: "Work with us", code: "07" },
  { view: "design", label: "Design system", code: "08" },
  { view: "media", label: "Media library", code: "09" },
  { view: "navigation", label: "Navigation", code: "10" },
  { view: "newsletter", label: "Newsletter", code: "11" },
  { view: "faq", label: "FAQ", code: "12" },
  { view: "gallery", label: "Galleries", code: "13" },
  { view: "agents", label: "Agents", code: "14" },
  { view: "models", label: "Models", code: "15" },
  { view: "settings", label: "Settings", code: "16" },
  { view: "social", label: "Social", code: "17" },
  { view: "logo", label: "Logo", code: "18" },
  { view: "partners", label: "Partners", code: "19" },
  { view: "team", label: "Dream team", code: "20" },
];

function Toasts() {
  const { toasts, dismissToast } = useOpsStore();
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[300] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto w-full border px-4 py-2.5 font-mono text-[12px] ${
              t.kind === "ok"
                ? "border-emerald-400/50 bg-emerald-950/95 text-emerald-200"
                : t.kind === "err"
                  ? "border-red-400/50 bg-red-950/95 text-red-200"
                  : "border-white/20 bg-stone-900/95 text-stone-200"
            }`}
          >
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ConsoleShell({ children }: { children: (view: OpsView) => ReactNode }) {
  const router = useRouter();
  const { view, setView, session, setSession, pushToast } = useOpsStore();
  const lastActive = useRef(Date.now());

  const logout = useCallback(async () => {
    const token = getOpsToken();
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).catch(() => undefined);
    setOpsToken(null);
    setSession({ authed: false, checked: true });
    router.push("/");
  }, [router, setSession]);

  // Client-side inactivity guard (server enforces at 30 min).
  useEffect(() => {
    const bump = () => {
      lastActive.current = Date.now();
    };
    const timer = setInterval(() => {
      if (Date.now() - lastActive.current > 30 * 60_000) {
        pushToast("info", "Session expired after 30 min idle.");
        void logout();
      }
    }, 30_000);
    window.addEventListener("mousemove", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("click", bump);
    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("click", bump);
    };
  }, [logout, pushToast]);

  return (
    <div className="ops-root min-h-screen">
      <Toasts />
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-4 lg:block">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300/80">Palawan Collective</p>
              <p className="mt-1 font-mono text-xl tracking-tight text-white">OPS CONSOLE</p>
            </div>
            <div className="flex items-center gap-3 lg:mt-4">
              <span className="flex items-center gap-2 font-mono text-[11px] text-stone-400">
                <Dot on={session.authed} /> {session.authed ? "live" : "locked"}
              </span>
              <button onClick={() => void logout()} className="font-mono text-[11px] uppercase tracking-widest text-stone-500 hover:text-white">
                Exit
              </button>
            </div>
          </div>
          <nav aria-label="Ops sections" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-0.5 lg:px-3 lg:pb-6">
            {NAV.map((n) => (
              <button
                key={n.view}
                onClick={() => setView(n.view)}
                aria-current={view === n.view ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 px-3 py-2.5 text-left font-mono text-[12px] uppercase tracking-[0.12em] transition-colors ${
                  view === n.view ? "bg-amber-400/15 text-amber-200" : "text-stone-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={view === n.view ? "text-amber-300" : "text-stone-600"}>{n.code}</span>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="hidden px-5 pb-6 lg:block">
            <a href="/" target="_blank" rel="noreferrer" className="font-mono text-[11px] uppercase tracking-widest text-stone-500 hover:text-amber-200">
              View live site ↗
            </a>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {children(view)}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                              */
/* ------------------------------------------------------------------ */

type Overview = {
  stats: Record<string, number>;
  traffic: { byDay: Array<[string, number]>; topPaths: Array<[string, number]> };
  inquiries: Array<{ id: number; kind: string; name: string; focus: string; createdAt: string; status: string }>;
  subscribers: Array<{ id: number; email: string; source: string | null; createdAt: string }>;
  agentLogs: Array<{ id: number; role: string; content: string; createdAt: string }>;
  provider: { active: string; openRouterKey: boolean; selectedModel: string | null; ollamaModel: string | null; ollamaUp: boolean | null; modelsCached: number; modelsFetchedAt: string | null };
};

export function OverviewPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { setView } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<Overview>("/api/admin/overview");
      setData(d);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) return <Empty text={err} />;
  if (!data) return <Empty text="Reading telemetry…" />;

  const s = data.stats;
  const stats: Array<[string, number, OpsView?]> = [
    ["Dispatches", s.stories, undefined],
    ["Builds", s.builds, undefined],
    ["Guides", s.guides, undefined],
    ["Sections", s.sections, "content"],
    ["Drafts", s.sectionsDraft, "content"],
    ["Subscribers", s.subscribers, "newsletter"],
    ["New subs · 7d", s.subscribers7, "newsletter"],
    ["Inquiries · new", s.inquiriesNew, "settings"],
    ["Views · 7d", s.views7, undefined],
    ["Agent chats · 30d", s.chats30, "agents"],
    ["Agents active", s.agentsActive, "agents"],
    ["Media files", s.media, "media"],
  ];
  const maxDay = Math.max(1, ...data.traffic.byDay.map(([, n]) => n));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value, view]) => (
          <button
            key={label}
            onClick={() => view && setView(view)}
            className={`ops-panel p-4 text-left ${view ? "cursor-pointer hover:border-amber-300/40" : "cursor-default"}`}
          >
            <p className="font-mono text-3xl text-white">{value}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-stone-400">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Model routing" sub="Where agent traffic goes right now" right={<Btn onClick={() => setView("models")}>Configure</Btn>}>
          <div className="space-y-3 font-mono text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Active provider</span>
              <span className="text-amber-200">{data.provider.active === "ollama" ? "OLLAMA · local" : "OPENROUTER · cloud"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Cloud model</span>
              <span className="max-w-55 truncate text-stone-200">{data.provider.selectedModel || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Local model</span>
              <span className="text-stone-200">{data.provider.ollamaModel || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Ollama host</span>
              <span className="flex items-center gap-2 text-stone-200">
                <Dot on={data.provider.ollamaUp === true} color={data.provider.ollamaUp === null ? "bg-stone-500" : data.provider.ollamaUp ? "bg-emerald-400" : "bg-red-400"} />
                {data.provider.ollamaUp === null ? "unknown" : data.provider.ollamaUp ? "reachable" : "down"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">API key</span>
              <span className="text-stone-200">{data.provider.openRouterKey ? "set" : "missing"}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Traffic · 7 days" sub="Pageviews collected on-site">
          <div className="flex h-28 items-end gap-1.5">
            {data.traffic.byDay.length === 0 && <span className="font-mono text-[12px] text-stone-500">No traffic yet — tracking starts now.</span>}
            {data.traffic.byDay.map(([day, n]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1" title={`${day}: ${n}`}>
                <span className="font-mono text-[10px] text-stone-400">{n}</span>
                <div className="w-full bg-amber-400/70" style={{ height: `${Math.max(4, (n / maxDay) * 72)}px` }} />
                <span className="font-mono text-[9px] text-stone-600">{day.slice(5)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1.5">
            {data.traffic.topPaths.map(([p, n]) => (
              <div key={p} className="flex justify-between font-mono text-[12px]">
                <span className="truncate text-stone-300">{p}</span>
                <span className="text-stone-500">{n}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Latest inquiries" sub="From Work With Us" right={<Btn onClick={() => setView("settings")}>Settings</Btn>}>
          <div className="space-y-3">
            {data.inquiries.length === 0 && <span className="font-mono text-[12px] text-stone-500">Queue is empty.</span>}
            {data.inquiries.map((q) => (
              <div key={q.id} className="border-b border-white/5 pb-2.5 last:border-0">
                <p className="text-[14px] text-stone-100">{q.name} <span className="text-stone-500">· {q.kind}</span></p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-stone-400">{q.focus} · {timeShort(q.createdAt)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Agent activity" sub="Latest operator conversations" right={<Btn onClick={() => setView("agents")}>Agents</Btn>}>
          <div className="max-h-64 space-y-2.5 overflow-y-auto">
            {data.agentLogs.length === 0 && <span className="font-mono text-[12px] text-stone-500">No conversations yet.</span>}
            {data.agentLogs.map((l) => (
              <div key={l.id} className={`max-w-[90%] px-3 py-2 text-[13px] leading-snug ${l.role === "user" ? "ml-auto bg-white/10 text-stone-100" : "bg-amber-400/10 text-stone-200"}`}>
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-stone-500">{l.role}</span>
                {l.content.slice(0, 280)}
              </div>
            ))}
          </div>
        </Panel>
        <VersionsPanel compact />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Versions                                                              */
/* ------------------------------------------------------------------ */

type Version = { id: number; entityType: string; entityId: string; label: string; createdAt: string };

export function VersionsPanel({ compact = false }: { compact?: boolean }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ versions: Version[] }>(`/api/admin/versions${filter ? `?entity=${filter}` : ""}`);
      setVersions(d.versions);
    } catch {
      /* keep stale */
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(id: number, label: string) {
    if (!window.confirm(`Restore “${label}”? Current state will be snapshotted first.`)) return;
    setBusy(id);
    try {
      await opsFetch("/api/admin/versions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      pushToast("ok", "Restored. Reload the live site to see it.");
      void load();
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Restore failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel
      title="Version history"
      sub="Every save snapshots first — undo anything"
      right={
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ops-inp !w-auto !py-1.5 font-mono text-[12px]" aria-label="Filter versions">
          <option value="">all</option>
          {["section", "design", "faq", "gallery", "nav", "agent", "settings", "story", "build", "guide", "image", "catalog", "team"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      }
    >
      <div className={`${compact ? "max-h-64" : "max-h-[60vh]"} space-y-1 overflow-y-auto`}>
        {versions.length === 0 && <span className="font-mono text-[12px] text-stone-500">No snapshots yet.</span>}
        {versions.slice(0, compact ? 8 : 40).map((v) => (
          <div key={v.id} className="flex items-center gap-3 border-b border-white/5 py-2 last:border-0">
            <span className="w-16 shrink-0 font-mono text-[11px] uppercase text-amber-300/80">{v.entityType}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-stone-200">{v.label}</span>
            <span className="shrink-0 font-mono text-[11px] text-stone-500">{timeShort(v.createdAt)}</span>
            <Btn kind="ok" disabled={busy === v.id} onClick={() => void restore(v.id, v.label)}>
              {busy === v.id ? "…" : "Restore"}
            </Btn>
          </div>
        ))}
      </div>
    </Panel>
  );
}
