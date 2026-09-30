"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { Btn, Dot, Empty, F, Inp, Panel, Sel, Txt, timeShort } from "./console";

/* ------------------------------------------------------------------ */
/* Types                                                                   */
/* ------------------------------------------------------------------ */

type Agent = {
  id: number; name: string; role: string; systemPrompt: string;
  temperature: number; maxTokens: number; behaviorRules: string;
  provider: string; modelId: string; status: string; isDefault: boolean;
};

type LogRow = { id: number; agentId: number | null; role: string; content: string; createdAt: string };

type Cached = { id: string; name: string; free: boolean; context?: number };

const ROLES = ["Site Operator", "Content Writer", "Customer Assistant", "Automation Manager"];

/* ------------------------------------------------------------------ */
/* Agent Control Center                                                    */
/* ------------------------------------------------------------------ */

export function AgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Agent | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Customer Assistant");
  const [testMsg, setTestMsg] = useState("");
  const [testOut, setTestOut] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ agents: Agent[]; logs: LogRow[] }>("/api/admin/agents");
      setAgents(d.agents);
      setLogs(d.logs);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: number, body: Partial<Agent>, msg = "Agent saved.") {
    try {
      const d = await opsJson<{ agent: Agent }>(`/api/admin/agents?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setAgents((prev) => prev.map((a) => (a.id === id ? d.agent : body.isDefault ? { ...a, isDefault: false } : a)));
      if (draft?.id === id) setDraft(d.agent);
      pushToast("ok", msg);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function create() {
    if (!newName.trim()) {
      pushToast("err", "Name the agent first.");
      return;
    }
    try {
      const d = await opsJson<{ agent: Agent }>("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), role: newRole }),
      });
      setAgents((prev) => [...prev, d.agent]);
      setNewName("");
      setAdding(false);
      setEditing(d.agent.id);
      setDraft(d.agent);
      pushToast("ok", "Agent created — stopped until you start it.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Create failed.");
    }
  }

  async function test(agentId: number) {
    if (!testMsg.trim()) return;
    setTestBusy(true);
    setTestOut(null);
    try {
      const res = await opsFetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMsg.trim(), agentId }),
      });
      const d = (await res.json()) as { ok?: boolean; reply?: string; provider?: string; model?: string; error?: string };
      setTestOut(d.ok && d.reply ? `[${d.provider} · ${d.model}]\n\n${d.reply}` : (d.error ?? "No reply."));
    } catch (e) {
      setTestOut(e instanceof Error ? e.message : "Test failed.");
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <Panel
        title="Agent control center"
        sub="Start / stop operators · the default agent powers the live chat"
        right={<Btn kind="primary" onClick={() => setAdding((v) => !v)}>+ New agent</Btn>}
      >
        {adding && (
          <div className="mb-4 grid gap-2 border border-amber-300/30 bg-amber-400/5 p-4 sm:grid-cols-[1fr_12rem_auto]">
            <Inp placeholder="Agent name — e.g. Booking Operator" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Sel value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Sel>
            <Btn kind="primary" onClick={() => void create()}>Create</Btn>
          </div>
        )}
        <div className="space-y-3">
          {agents.map((a) => {
            const isEditing = editing === a.id;
            const d = isEditing && draft ? draft : a;
            const active = a.status === "active";
            return (
              <div key={a.id} className={`border ${active ? "border-emerald-400/30" : "border-white/10"} bg-white/[0.02]`}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Dot on={active} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-white">
                      {a.name}
                      {a.isDefault && <span className="ml-2 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-amber-200">default · live chat</span>}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                      {a.role} · {a.provider}{a.modelId ? ` · ${a.modelId}` : " · fleet default"} · temp {a.temperature} · {a.maxTokens} tok
                    </p>
                  </div>
                  <Btn kind={active ? "ghost" : "ok"} onClick={() => void patch(a.id, { status: active ? "stopped" : "active" }, active ? "Agent stopped." : "Agent started.")}>
                    {active ? "■ Stop" : "▶ Start"}
                  </Btn>
                  <Btn onClick={() => { setEditing(isEditing ? null : a.id); setDraft(a); setTestOut(null); }}>{isEditing ? "Close" : "Configure"}</Btn>
                </div>
                {isEditing && draft && (
                  <div className="grid gap-3 border-t border-white/10 p-4 lg:grid-cols-2">
                    <F label="Name"><Inp value={d.name} onChange={(e) => setDraft({ ...d, name: e.target.value })} /></F>
                    <F label="Role">
                      <Sel value={ROLES.includes(d.role) ? d.role : "__custom"} onChange={(e) => e.target.value !== "__custom" && setDraft({ ...d, role: e.target.value })}>
                        {!ROLES.includes(d.role) && <option value="__custom">{d.role} (custom)</option>}
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </Sel>
                    </F>
                    <div className="lg:col-span-2">
                      <F label="System prompt" hint="Who the agent is, what it knows, how it sounds."><Txt rows={5} value={d.systemPrompt} onChange={(e) => setDraft({ ...d, systemPrompt: e.target.value })} className="font-mono text-[13px]" /></F>
                    </div>
                    <div className="lg:col-span-2">
                      <F label="Behavior rules" hint="Hard constraints, one per line."><Txt rows={3} value={d.behaviorRules} onChange={(e) => setDraft({ ...d, behaviorRules: e.target.value })} className="font-mono text-[13px]" /></F>
                    </div>
                    <F label={`Temperature · ${d.temperature}`}>
                      <input type="range" min={0} max={2} step={0.05} value={d.temperature} onChange={(e) => setDraft({ ...d, temperature: Number(e.target.value) })} className="ops-range" />
                    </F>
                    <F label="Max tokens (50–8000)">
                      <Inp type="number" min={50} max={8000} value={d.maxTokens} onChange={(e) => setDraft({ ...d, maxTokens: Number(e.target.value) || 800 })} />
                    </F>
                    <F label="Provider" hint="Auto = fleet default from Models.">
                      <Sel value={d.provider} onChange={(e) => setDraft({ ...d, provider: e.target.value })}>
                        <option value="auto">auto (fleet)</option>
                        <option value="openrouter">openrouter</option>
                        <option value="ollama">ollama (local)</option>
                      </Sel>
                    </F>
                    <F label="Model override" hint="Blank = fleet model.">
                      <Inp value={d.modelId} onChange={(e) => setDraft({ ...d, modelId: e.target.value })} placeholder="e.g. meta-llama/… or llama3.1" className="font-mono text-[13px]" />
                    </F>
                    <div className="flex flex-wrap gap-2 lg:col-span-2">
                      <Btn
                        kind="primary"
                        onClick={() => draft && void patch(a.id, {
                          name: draft.name, role: draft.role, systemPrompt: draft.systemPrompt,
                          behaviorRules: draft.behaviorRules, temperature: draft.temperature,
                          maxTokens: draft.maxTokens, provider: draft.provider, modelId: draft.modelId,
                        })}
                      >
                        Save agent
                      </Btn>
                      {!a.isDefault && <Btn kind="ok" onClick={() => void patch(a.id, { isDefault: true }, "Default agent switched.")}>Make default</Btn>}
                      {!a.isDefault && (
                        <Btn
                          kind="danger"
                          onClick={() => {
                            if (!window.confirm(`Delete “${a.name}”?`)) return;
                            opsFetch(`/api/admin/agents?id=${a.id}`, { method: "DELETE" })
                              .then(() => {
                                setAgents((prev) => prev.filter((x) => x.id !== a.id));
                                setEditing(null);
                                pushToast("ok", "Agent deleted.");
                              })
                              .catch((e: Error) => pushToast("err", e.message));
                          }}
                        >
                          Delete
                        </Btn>
                      )}
                    </div>
                    <div className="border-t border-white/10 pt-3 lg:col-span-2">
                      <F label={`Test “${a.name}”`} hint="Runs a real completion through the active model route.">
                        <div className="flex gap-2">
                          <Inp placeholder="Ask something…" value={testMsg} onChange={(e) => setTestMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void test(a.id)} />
                          <Btn kind="primary" disabled={testBusy} onClick={() => void test(a.id)}>{testBusy ? "…" : "Run"}</Btn>
                        </div>
                      </F>
                      {testOut && <p className="mt-2 whitespace-pre-wrap border border-white/10 bg-black/30 p-3 font-mono text-[12px] leading-relaxed text-stone-200">{testOut}</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {agents.length === 0 && <Empty text="No agents yet." />}
        </div>
      </Panel>

      <Panel title="Live transcript" sub="Newest operator traffic">
        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className={`px-3 py-2 text-[13px] leading-snug ${l.role === "user" ? "ml-6 bg-white/10 text-stone-100" : "mr-6 bg-amber-400/10 text-stone-200"}`}>
              <span className="mb-1 block font-mono text-[10px] uppercase text-stone-500">{l.role} · {timeShort(l.createdAt)}</span>
              {l.content.slice(0, 320)}
            </div>
          ))}
          {logs.length === 0 && <Empty text="Quiet for now." />}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Model Configuration                                                   */
/* ------------------------------------------------------------------ */

type ModelConfig = {
  id: number; provider: string; showFree: boolean; showPaid: boolean;
  selectedModel: string; ollamaBaseUrl: string; ollamaModel: string;
  modelsCache: Cached[]; modelsFetchedAt: string | null;
  hasOpenRouterKey: boolean; openrouterKeyMasked: string;
};

export function ModelsPanel() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [ollama, setOllama] = useState<Cached[]>([]);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [refreshing, setRefreshing] = useState<"openrouter" | "ollama" | null>(null);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const [c, m] = await Promise.all([
        opsJson<{ config: ModelConfig }>("/api/admin/model-config"),
        opsJson<{ openrouter: Cached[]; fetchedAt: string | null; ollama: Cached[]; ollamaError: string | null }>("/api/admin/models/refresh"),
      ]);
      setConfig({ ...c.config, modelsCache: m.openrouter.length > 0 ? m.openrouter : c.config.modelsCache });
      setOllama(m.ollama);
      setOllamaError(m.ollamaError);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: Partial<ModelConfig> & { openrouterKey?: string; clearKey?: boolean }) {
    setSaving(true);
    try {
      const d = await opsJson<{ config: ModelConfig }>("/api/admin/model-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setConfig((prev) => (prev ? { ...d.config, modelsCache: prev.modelsCache } : { ...d.config, modelsCache: [] }));
      setKeyInput("");
      pushToast("ok", "Model routing saved.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function refresh(source: "openrouter" | "ollama") {
    setRefreshing(source);
    try {
      const d = await opsJson<{ openrouter: Cached[]; ollama: Cached[]; errors: string[]; counts: { free: number } }>(
        "/api/admin/models/refresh",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source }) },
      );
      if (source === "openrouter") {
        setConfig((prev) => (prev ? { ...prev, modelsCache: d.openrouter, modelsFetchedAt: new Date().toISOString() } : prev));
        pushToast(d.errors.length ? "info" : "ok", d.errors.length ? d.errors.join(" · ") : `${d.openrouter.length} models · ${d.counts.free} free.`);
      } else {
        setOllama(d.ollama);
        setOllamaError(d.errors[0] ?? null);
        pushToast(d.errors.length ? "err" : "ok", d.errors.length ? d.errors[0] : `${d.ollama.length} local model(s) found.`);
      }
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Refresh failed.");
    } finally {
      setRefreshing(null);
    }
  }

  const models = useMemo(() => {
    if (!config) return [];
    return config.modelsCache
      .filter((m) => (m.free ? config.showFree : config.showPaid))
      .filter((m) => !filter || m.id.toLowerCase().includes(filter.toLowerCase()));
  }, [config, filter]);

  if (!config) return <Empty text="Loading model configuration…" />;

  const useLocal = config.provider === "ollama";

  return (
    <div className="space-y-5">
      <Panel title="Fleet routing" sub="Fallback: local model when active → else OpenRouter → else on-site knowledge base">
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <button
            onClick={() => void save({ provider: "openrouter" })}
            className={`border p-5 text-left transition-colors ${!useLocal ? "border-amber-300/60 bg-amber-400/10" : "border-white/10 hover:border-white/30"}`}
          >
            <p className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-widest text-white">
              <Dot on={!useLocal} /> OpenRouter
            </p>
            <p className="mt-1 font-mono text-[11px] text-stone-400">cloud · {config.modelsCache.length} cached · {config.selectedModel || "no model picked"}</p>
          </button>
          <span className="text-center font-mono text-[11px] uppercase text-stone-500">route →</span>
          <button
            onClick={() => void save({ provider: "ollama" })}
            className={`border p-5 text-left transition-colors ${useLocal ? "border-emerald-300/60 bg-emerald-400/10" : "border-white/10 hover:border-white/30"}`}
          >
            <p className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-widest text-white">
              <Dot on={useLocal} /> Use local model
            </p>
            <p className="mt-1 font-mono text-[11px] text-stone-400">
              ollama · {ollama.length > 0 ? `${ollama.length} detected` : ollamaError ? "host unreachable" : "—"} · {config.ollamaModel || "no model picked"}
            </p>
          </button>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="OpenRouter"
          sub={config.modelsFetchedAt ? `Catalog synced ${timeShort(config.modelsFetchedAt)}` : "Catalog never synced"}
          right={<Btn kind="primary" disabled={refreshing === "openrouter"} onClick={() => void refresh("openrouter")}>{refreshing === "openrouter" ? "Syncing…" : "↻ Refresh models"}</Btn>}
        >
          <div className="space-y-3">
            <F label={`API key · ${config.hasOpenRouterKey ? config.openrouterKeyMasked : "not set"}`} hint="Stored server-side. Needed for paid models and chat completions.">
              <div className="flex gap-2">
                <Inp type="password" placeholder="sk-or-…" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} className="font-mono" />
                <Btn disabled={!keyInput.trim() || saving} onClick={() => void save({ openrouterKey: keyInput.trim() })}>Set</Btn>
                {config.hasOpenRouterKey && <Btn kind="danger" onClick={() => void save({ clearKey: true })}>Clear</Btn>}
              </div>
            </F>
            <div className="flex gap-5">
              <span className="flex items-center gap-2 font-mono text-[12px] text-stone-300">
                <input type="checkbox" checked={config.showFree} onChange={(e) => { const showFree = e.target.checked; setConfig({ ...config, showFree }); void save({ showFree }); }} className="h-4 w-4 accent-amber-400" /> Free
              </span>
              <span className="flex items-center gap-2 font-mono text-[12px] text-stone-300">
                <input type="checkbox" checked={config.showPaid} onChange={(e) => { const showPaid = e.target.checked; setConfig({ ...config, showPaid }); void save({ showPaid }); }} className="h-4 w-4 accent-amber-400" /> Paid
              </span>
            </div>
            <F label={`Fleet model · ${models.length} shown`}>
              <Inp placeholder="Filter models…" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-2" />
              <Sel value={config.selectedModel} onChange={(e) => void save({ selectedModel: e.target.value })} size={8} className="font-mono text-[12px]">
                <option value="">— pick a model —</option>
                {models.slice(0, 300).map((m) => (
                  <option key={m.id} value={m.id}>{m.free ? "◈ " : "○ "}{m.id}</option>
                ))}
              </Sel>
            </F>
            <p className="font-mono text-[11px] text-stone-500">◈ free · ○ paid. Models change often — refresh pulls the live catalog.</p>
          </div>
        </Panel>

        <Panel
          title="Ollama · local"
          sub={ollamaError ?? (ollama.length > 0 ? `${ollama.length} model(s) on host` : "Host not probed yet")}
          right={<Btn kind="primary" disabled={refreshing === "ollama"} onClick={() => void refresh("ollama")}>{refreshing === "ollama" ? "Probing…" : "↻ Probe host"}</Btn>}
        >
          <div className="space-y-3">
            <F label="Base URL" hint="Where Ollama listens. This sandbox usually has none — production host goes here.">
              <div className="flex gap-2">
                <Inp value={config.ollamaBaseUrl} onChange={(e) => setConfig({ ...config, ollamaBaseUrl: e.target.value })} className="font-mono text-[13px]" />
                <Btn disabled={saving} onClick={() => void save({ ollamaBaseUrl: config.ollamaBaseUrl })}>Set</Btn>
              </div>
            </F>
            <F label="Local model">
              {ollama.length > 0 ? (
                <Sel value={config.ollamaModel} onChange={(e) => void save({ ollamaModel: e.target.value })}>
                  <option value="">— pick a model —</option>
                  {ollama.map((m) => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))}
                </Sel>
              ) : (
                <div className="flex gap-2">
                  <Inp value={config.ollamaModel} onChange={(e) => setConfig({ ...config, ollamaModel: e.target.value })} placeholder="e.g. llama3.1:8b" className="font-mono text-[13px]" />
                  <Btn disabled={saving} onClick={() => void save({ ollamaModel: config.ollamaModel })}>Set</Btn>
                </div>
              )}
            </F>
            <div className="border border-white/10 bg-black/20 p-3 font-mono text-[12px] leading-relaxed text-stone-300">
              <p>ollama pull llama3.1:8b <span className="text-stone-600"># on the host</span></p>
              <p>OLLAMA_HOST=0.0.0.0 <span className="text-stone-600"># to serve the LAN</span></p>
            </div>
            {!useLocal && (
              <Btn kind="ok" onClick={() => void save({ provider: "ollama" })}>Switch fleet to local</Btn>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
