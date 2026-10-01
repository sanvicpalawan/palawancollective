"use client";

import { useCallback, useEffect, useState } from "react";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { Btn, Dot, Empty, F, Inp, Panel, Sel, Tog, Txt, timeShort } from "./console";

/* ------------------------------------------------------------------ */
/* Shared                                                                  */
/* ------------------------------------------------------------------ */

type Section = {
  id: number; page: string; key: string; type: string; title: string;
  position: number; visible: boolean; status: string; data: Record<string, unknown>;
};

const SECTION_TYPES = ["hero", "team", "text_image", "story_blocks", "gallery", "grid", "cta", "newsletter", "faq", "custom"];

const DATA_HINTS: Record<string, string> = {
  hero: "index · eyebrow",
  team: "index · first · second · description · href · linkLabel",
  text_image: "kicker · title · body (blank line = new paragraph) · image · imageAlt · flip (true) · ctaHref · ctaLabel",
  story_blocks: "index · first · note",
  gallery: "gallerySlug · index",
  grid: "index · first · second · description · items (JSON mode)",
  cta: "kicker · title · copy · primaryLabel · primaryHref · secondaryLabel · secondaryHref",
  newsletter: "title · subtitle · copy",
  faq: "index · first · second",
  custom: "kicker · title · body · image · imageAlt · ctaHref · ctaLabel",
};

function useDragReorder<T extends { id: number }>(items: T[], onReorder: (ids: number[]) => void) {
  const [dragId, setDragId] = useState<number | null>(null);
  return {
    dragId,
    handlers: (id: number) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        setDragId(id);
        e.dataTransfer.effectAllowed = "move";
      },
      onDragEnd: () => setDragId(null),
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (dragId === null || dragId === id) return;
        const ids = items.map((x) => x.id);
        const from = ids.indexOf(dragId);
        const to = ids.indexOf(id);
        ids.splice(to, 0, ...ids.splice(from, 1));
        onReorder(ids);
        setDragId(null);
      },
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Content Builder                                                         */
/* ------------------------------------------------------------------ */

function DataEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const [jsonMode, setJsonMode] = useState(false);
  const [raw, setRaw] = useState("");
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    setRaw(JSON.stringify(data, null, 2));
  }, [jsonMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (jsonMode) {
    return (
      <div>
        <div className="mb-2 flex justify-end">
          <Btn onClick={() => setJsonMode(false)}>Key / value mode</Btn>
        </div>
        <Txt rows={10} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono text-[12px]" />
        <div className="mt-2 flex justify-end">
          <Btn
            kind="primary"
            onClick={() => {
              try {
                onChange(JSON.parse(raw) as Record<string, unknown>);
              } catch {
                useOpsStore.getState().pushToast("err", "Invalid JSON — nothing applied.");
              }
            }}
          >
            Apply JSON
          </Btn>
        </div>
      </div>
    );
  }

  const entries = Object.entries(data);
  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Btn onClick={() => setJsonMode(true)}>JSON mode</Btn>
      </div>
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[10rem_1fr_auto] items-start gap-2">
            <span className="truncate px-1 py-2 font-mono text-[12px] text-amber-200/90">{k}</span>
            {typeof v === "string" && v.length > 80 ? (
              <Txt rows={3} value={v} onChange={(e) => onChange({ ...data, [k]: e.target.value })} />
            ) : (
              <Inp
                value={typeof v === "string" ? v : JSON.stringify(v)}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({ ...data, [k]: val === "true" ? true : val === "false" ? false : val });
                }}
              />
            )}
            <button
              onClick={() => {
                const next = { ...data };
                delete next[k];
                onChange(next);
              }}
              className="px-2 py-2 font-mono text-[12px] text-stone-500 hover:text-red-300"
              aria-label={`Remove ${k}`}
            >
              ✕
            </button>
          </div>
        ))}
        {entries.length === 0 && <p className="font-mono text-[12px] text-stone-500">No fields yet — add one below.</p>}
      </div>
      <div className="mt-3 flex gap-2">
        <Inp placeholder="new-field-name" value={newKey} onChange={(e) => setNewKey(e.target.value.replace(/\s/g, ""))} className="max-w-55" />
        <Btn
          onClick={() => {
            if (!newKey) return;
            onChange({ ...data, [newKey]: "" });
            setNewKey("");
          }}
        >
          + Field
        </Btn>
      </div>
    </div>
  );
}

export function ContentPanel() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Section | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("custom");
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ sections: Section[] }>("/api/admin/sections");
      setSections(d.sections);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reorder(ids: number[]) {
    setSections((prev) => ids.map((id) => prev.find((s) => s.id === id)!).filter(Boolean));
    try {
      await opsFetch("/api/admin/sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reorder: ids }) });
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Reorder failed.");
      void load();
    }
  }

  const { dragId, handlers } = useDragReorder(sections, (ids) => void reorder(ids));

  async function save(id: number, patch: Partial<Section>) {
    try {
      const d = await opsJson<{ section: Section }>(`/api/admin/sections?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSections((prev) => prev.map((s) => (s.id === id ? d.section : s)));
      if (draft?.id === id) setDraft(d.section);
      pushToast("ok", "Saved — live on next page load.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function duplicate(id: number) {
    try {
      const d = await opsJson<{ section: Section }>("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id }),
      });
      setSections((prev) => [...prev, d.section].sort((a, b) => a.position - b.position));
      pushToast("ok", `Duplicated as draft: ${d.section.title}`);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Duplicate failed.");
    }
  }

  async function remove(id: number, title: string) {
    if (!window.confirm(`Delete “${title}”? A snapshot is kept in version history.`)) return;
    try {
      await opsFetch(`/api/admin/sections?id=${id}`, { method: "DELETE" });
      setSections((prev) => prev.filter((s) => s.id !== id));
      if (editing === id) {
        setEditing(null);
        setDraft(null);
      }
      pushToast("ok", "Section deleted.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function create() {
    if (!newTitle.trim()) {
      pushToast("err", "Give the section a title.");
      return;
    }
    try {
      const d = await opsJson<{ section: Section }>("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), type: newType, status: "draft", position: sections.length }),
      });
      setSections((prev) => [...prev, d.section]);
      setNewTitle("");
      setAdding(false);
      pushToast("ok", "Draft created — publish when ready.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Create failed.");
    }
  }

  if (loading) return <Empty text="Loading sections…" />;

  return (
    <div className="space-y-4">
      <Panel
        title="Homepage sections"
        sub="Drag to reorder · click a title to rename · publish drafts when ready"
        right={<Btn kind="primary" onClick={() => setAdding((v) => !v)}>+ New section</Btn>}
      >
        {adding && (
          <div className="mb-4 grid gap-3 border border-amber-300/30 bg-amber-400/5 p-4 sm:grid-cols-[1fr_12rem_auto]">
            <Inp placeholder="Section title…" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Sel value={newType} onChange={(e) => setNewType(e.target.value)}>
              {SECTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Sel>
            <Btn kind="primary" onClick={() => void create()}>Create draft</Btn>
          </div>
        )}
        <div className="space-y-2">
          {sections.map((s) => {
            const isEditing = editing === s.id;
            const d = isEditing && draft ? draft : s;
            return (
              <div
                key={s.id}
                {...handlers(s.id)}
                className={`border transition-colors ${dragId === s.id ? "border-amber-300/60" : "border-white/10"} bg-white/[0.02]`}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="cursor-grab font-mono text-stone-600" title="Drag to reorder" aria-hidden="true">⋮⋮</span>
                  <Tog on={d.visible} onChange={(v) => void save(s.id, { visible: v })} label={`Toggle ${s.title}`} />
                  <button
                    onClick={() => void save(s.id, { status: s.status === "published" ? "draft" : "published" })}
                    title="Toggle draft / published"
                    className={`shrink-0 px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${s.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}
                  >
                    {s.status}
                  </button>
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-widest text-stone-500 sm:inline">{s.type}</span>
                  {isEditing ? (
                    <Inp
                      value={d.title}
                      onChange={(e) => setDraft({ ...d, title: e.target.value })}
                      onBlur={() => {
                        if (d.title !== s.title) void save(s.id, { title: d.title });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && d.title !== s.title) void save(s.id, { title: d.title });
                      }}
                      className="!py-1.5 text-[14px]"
                      aria-label="Section title"
                    />
                  ) : (
                    <button onClick={() => { setEditing(s.id); setDraft(s); }} className="min-w-0 flex-1 truncate text-left text-[14px] text-stone-100 hover:text-amber-200" title="Click to edit">
                      {s.title}
                    </button>
                  )}
                  <span className="hidden shrink-0 font-mono text-[10px] text-stone-600 md:inline">{s.key}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Btn onClick={() => void duplicate(s.id)} title="Duplicate as draft">⧉</Btn>
                    <Btn onClick={() => { setEditing(isEditing ? null : s.id); setDraft(s); }}>{isEditing ? "Close" : "Edit"}</Btn>
                    <Btn kind="danger" onClick={() => void remove(s.id, s.title)} title="Delete">✕</Btn>
                  </div>
                </div>
                {isEditing && draft && (
                  <div className="grid gap-4 border-t border-white/10 p-4 lg:grid-cols-[16rem_1fr]">
                    <div className="space-y-3">
                      <F label="Key (stable id)">
                        <Inp value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} onBlur={() => draft.key !== s.key && void save(s.id, { key: draft.key })} />
                      </F>
                      <F label="Type">
                        <Sel value={draft.type} onChange={(e) => { const type = e.target.value; setDraft({ ...draft, type }); void save(s.id, { type }); }}>
                          {SECTION_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </Sel>
                      </F>
                      <p className="font-mono text-[11px] leading-relaxed text-stone-500">
                        fields: {DATA_HINTS[draft.type] ?? "kicker · title · body · image · ctaHref · ctaLabel"}
                      </p>
                    </div>
                    <div>
                      <F label="Content fields">
                        <DataEditor data={(draft.data ?? {}) as Record<string, unknown>} onChange={(data) => setDraft({ ...draft, data })} />
                      </F>
                      <div className="mt-3 flex justify-end">
                        <Btn kind="primary" onClick={() => draft && void save(s.id, { data: draft.data, title: draft.title })}>Save fields</Btn>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                                */
/* ------------------------------------------------------------------ */

type NavRow = { id: number; location: string; label: string; href: string; position: number; visible: boolean };

export function NavigationPanel() {
  const [rows, setRows] = useState<NavRow[]>([]);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ nav: NavRow[] }>("/api/admin/navigation");
      setRows(d.nav);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reorder(ids: number[]) {
    setRows((prev) => ids.map((id) => prev.find((r) => r.id === id)!).filter(Boolean));
    try {
      await opsFetch("/api/admin/navigation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reorder: ids }) });
    } catch {
      void load();
    }
  }

  const { dragId, handlers } = useDragReorder(rows, (ids) => void reorder(ids));

  async function patch(id: number, body: Partial<NavRow>) {
    try {
      await opsFetch(`/api/admin/navigation?id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...body } : r)));
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function create() {
    if (!label.trim() || !href.trim()) {
      pushToast("err", "Label and link are required.");
      return;
    }
    try {
      const d = await opsJson<{ item: NavRow }>("/api/admin/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), href: href.trim(), position: rows.length }),
      });
      setRows((prev) => [...prev, d.item]);
      setLabel("");
      setHref("");
      pushToast("ok", "Menu item added.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Create failed.");
    }
  }

  return (
    <Panel title="Header navigation" sub="Drag to reorder · anchors (/​#systems) or routes (/stories)">
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Inp placeholder="Label — e.g. Field Notes" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Inp placeholder="Link — e.g. /#field-notes" value={href} onChange={(e) => setHref(e.target.value)} />
        <Btn kind="primary" onClick={() => void create()}>+ Add</Btn>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} {...handlers(r.id)} className={`flex items-center gap-3 border bg-white/[0.02] px-3 py-2.5 ${dragId === r.id ? "border-amber-300/60" : "border-white/10"}`}>
            <span className="cursor-grab font-mono text-stone-600" aria-hidden="true">⋮⋮</span>
            <Tog on={r.visible} onChange={(v) => void patch(r.id, { visible: v })} label={`Toggle ${r.label}`} />
            <Inp value={r.label} aria-label="Label" onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))} onBlur={(e) => void patch(r.id, { label: e.target.value })} className="max-w-45" />
            <Inp value={r.href} aria-label="Link" onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, href: e.target.value } : x)))} onBlur={(e) => void patch(r.id, { href: e.target.value })} className="font-mono text-[13px]" />
            <Btn kind="danger" onClick={() => { if (window.confirm(`Remove “${r.label}”?`)) { void opsFetch(`/api/admin/navigation?id=${r.id}`, { method: "DELETE" }).then(() => setRows((prev) => prev.filter((x) => x.id !== r.id))); } }}>✕</Btn>
          </div>
        ))}
        {rows.length === 0 && <Empty text="No menu items." />}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                     */
/* ------------------------------------------------------------------ */

type FaqRow = { id: number; question: string; answer: string; position: number; visible: boolean };

export function FaqPanel() {
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ faqs: FaqRow[] }>("/api/admin/faqs");
      setRows(d.faqs);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reorder(ids: number[]) {
    setRows((prev) => ids.map((id) => prev.find((r) => r.id === id)!).filter(Boolean));
    try {
      await opsFetch("/api/admin/faqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reorder: ids }) });
    } catch {
      void load();
    }
  }

  const { dragId, handlers } = useDragReorder(rows, (ids) => void reorder(ids));

  async function save(id: number, patch: Partial<FaqRow>) {
    try {
      await opsFetch(`/api/admin/faqs?id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      pushToast("ok", "FAQ saved.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function create() {
    if (!q.trim() || !a.trim()) {
      pushToast("err", "Question and answer are required.");
      return;
    }
    try {
      const d = await opsJson<{ faq: FaqRow }>("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim(), answer: a.trim(), position: rows.length }),
      });
      setRows((prev) => [...prev, d.faq]);
      setQ("");
      setA("");
      pushToast("ok", "FAQ added.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Create failed.");
    }
  }

  return (
    <Panel title="FAQ manager" sub="Accordion on the live site · drag to reorder">
      <div className="mb-4 grid gap-2 border border-white/10 p-4">
        <Inp placeholder="Question…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Txt placeholder="Answer…" rows={3} value={a} onChange={(e) => setA(e.target.value)} />
        <div><Btn kind="primary" onClick={() => void create()}>+ Add FAQ</Btn></div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} {...handlers(r.id)} className={`border bg-white/[0.02] ${dragId === r.id ? "border-amber-300/60" : "border-white/10"}`}>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="cursor-grab font-mono text-stone-600" aria-hidden="true">⋮⋮</span>
              <Tog on={r.visible} onChange={(v) => void save(r.id, { visible: v })} label="Toggle visibility" />
              <button onClick={() => setEditing(editing === r.id ? null : r.id)} className="min-w-0 flex-1 truncate text-left text-[14px] text-stone-100 hover:text-amber-200">
                {r.question}
              </button>
              <Btn onClick={() => setEditing(editing === r.id ? null : r.id)}>{editing === r.id ? "Close" : "Edit"}</Btn>
              <Btn kind="danger" onClick={() => { if (window.confirm("Delete this FAQ?")) { void opsFetch(`/api/admin/faqs?id=${r.id}`, { method: "DELETE" }).then(() => setRows((prev) => prev.filter((x) => x.id !== r.id))); } }}>✕</Btn>
            </div>
            {editing === r.id && (
              <FaqEditor
                row={r}
                onSave={(patch) => {
                  void save(r.id, patch).then(() => setEditing(null));
                }}
              />
            )}
          </div>
        ))}
        {rows.length === 0 && <Empty text="No FAQs yet." />}
      </div>
    </Panel>
  );
}

function FaqEditor({ row, onSave }: { row: FaqRow; onSave: (p: Partial<FaqRow>) => void }) {
  const [question, setQuestion] = useState(row.question);
  const [answer, setAnswer] = useState(row.answer);
  return (
    <div className="grid gap-2 border-t border-white/10 p-4">
      <Inp value={question} onChange={(e) => setQuestion(e.target.value)} aria-label="Question" />
      <Txt rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} aria-label="Answer" />
      <div><Btn kind="primary" onClick={() => onSave({ question, answer })}>Save</Btn></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Newsletter                                                              */
/* ------------------------------------------------------------------ */

type Sub = { id: number; email: string; source: string | null; createdAt: string };

export function NewsletterPanel() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [text, setText] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ subscribers: Sub[]; text: Record<string, unknown> }>("/api/admin/newsletter");
      setSubs(d.subscribers);
      const t: Record<string, string> = {};
      for (const [k, v] of Object.entries(d.text)) t[k] = typeof v === "string" ? v : "";
      setText(t);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveText() {
    try {
      await opsFetch("/api/admin/newsletter", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: text }) });
      pushToast("ok", "Newsletter copy saved.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function exportCsv() {
    try {
      const res = await opsFetch("/api/admin/newsletter?format=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `palawan-dispatch-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Export failed.");
    }
  }

  const filtered = subs.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Section copy" sub="Powers the Field Notes block + footer">
        <div className="space-y-3">
          <F label="Title"><Inp value={text.newsletter_title ?? ""} onChange={(e) => setText({ ...text, newsletter_title: e.target.value })} /></F>
          <F label="Subtitle"><Inp value={text.newsletter_subtitle ?? ""} onChange={(e) => setText({ ...text, newsletter_subtitle: e.target.value })} /></F>
          <F label="Copy"><Txt rows={3} value={text.newsletter_copy ?? ""} onChange={(e) => setText({ ...text, newsletter_copy: e.target.value })} /></F>
          <div className="border-t border-white/10 pt-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">External provider (placeholder — connect later)</p>
            <div className="mt-2 grid gap-3">
              <F label="Provider"><Sel value={text.newsletter_provider ?? "none"} onChange={(e) => setText({ ...text, newsletter_provider: e.target.value })}>
                {["none", "buttondown", "convertkit", "mailchimp", "loops", "custom"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Sel></F>
              <F label="API endpoint / form URL" hint="When set, signups can be mirrored out — wiring comes next."><Inp value={text.newsletter_provider_url ?? ""} onChange={(e) => setText({ ...text, newsletter_provider_url: e.target.value })} placeholder="https://…" /></F>
            </div>
          </div>
          <Btn kind="primary" onClick={() => void saveText()}>Save copy</Btn>
        </div>
      </Panel>

      <Panel
        title={`Subscribers · ${subs.length}`}
        sub="Collected on-site"
        right={<Btn onClick={() => void exportCsv()}>Export CSV</Btn>}
      >
        <Inp placeholder="Search emails…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />
        <div className="max-h-[52vh] space-y-1 overflow-y-auto">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border-b border-white/5 py-2">
              <Dot on />
              <span className="min-w-0 flex-1 truncate text-[13px] text-stone-100">{s.email}</span>
              <span className="hidden font-mono text-[11px] text-stone-500 sm:inline">{s.source ?? "site"}</span>
              <span className="shrink-0 font-mono text-[11px] text-stone-500">{timeShort(s.createdAt)}</span>
              <button
                className="shrink-0 px-1 font-mono text-[12px] text-stone-600 hover:text-red-300"
                aria-label={`Remove ${s.email}`}
                onClick={() => { if (window.confirm(`Remove ${s.email}?`)) { void opsFetch(`/api/admin/newsletter?id=${s.id}`, { method: "DELETE" }).then(() => setSubs((prev) => prev.filter((x) => x.id !== s.id))); } }}
              >
                ✕
              </button>
            </div>
          ))}
          {filtered.length === 0 && <Empty text="No subscribers match." />}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Galleries                                                               */
/* ------------------------------------------------------------------ */

type GItem = { mediaId: number | null; url: string; caption?: string; kind: "image" | "video" };
type Gal = { id: number; slug: string; title: string; description: string; layout: string; items: GItem[]; position: number; visible: boolean };
type MediaRow = { id: number; url: string; mime: string };

export function GalleryPanel() {
  const [gals, setGals] = useState<Gal[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [title, setTitle] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addCaption, setAddCaption] = useState("");
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const [g, m] = await Promise.all([
        opsJson<{ galleries: Gal[] }>("/api/admin/galleries"),
        opsJson<{ media: MediaRow[] }>("/api/admin/media"),
      ]);
      setGals(g.galleries);
      setMedia(m.media);
      setActive((a) => a ?? g.galleries[0]?.id ?? null);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const gal = gals.find((x) => x.id === active) ?? null;

  async function patch(id: number, body: Partial<Gal>, silent = false) {
    try {
      const d = await opsJson<{ gallery: Gal }>(`/api/admin/galleries?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setGals((prev) => prev.map((x) => (x.id === id ? d.gallery : x)));
      if (!silent) pushToast("ok", "Gallery saved.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function create() {
    if (!title.trim()) {
      pushToast("err", "Give the gallery a title.");
      return;
    }
    try {
      const d = await opsJson<{ gallery: Gal }>("/api/admin/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), position: gals.length }),
      });
      setGals((prev) => [...prev, d.gallery]);
      setActive(d.gallery.id);
      setTitle("");
      pushToast("ok", "Gallery created.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Create failed.");
    }
  }

  function moveItem(from: number, dir: -1 | 1) {
    if (!gal) return;
    const to = from + dir;
    if (to < 0 || to >= gal.items.length) return;
    const items = [...gal.items];
    const [it] = items.splice(from, 1);
    items.splice(to, 0, it);
    void patch(gal.id, { items }, true);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[18rem_1fr]">
      <Panel title="Galleries" sub="Assign one per section via gallerySlug">
        <div className="mb-3 flex gap-2">
          <Inp placeholder="New gallery title…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Btn kind="primary" onClick={() => void create()}>+</Btn>
        </div>
        <div className="space-y-2">
          {gals.map((x) => (
            <button
              key={x.id}
              onClick={() => setActive(x.id)}
              className={`flex w-full items-center gap-2 border px-3 py-2.5 text-left ${x.id === active ? "border-amber-300/50 bg-amber-400/5" : "border-white/10 hover:border-white/25"}`}
            >
              <Dot on={x.visible} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-stone-100">{x.title}</span>
                <span className="block font-mono text-[11px] text-stone-500">{x.slug} · {x.items.length} items · {x.layout}</span>
              </span>
            </button>
          ))}
          {gals.length === 0 && <Empty text="No galleries yet." />}
        </div>
      </Panel>

      {!gal ? (
        <Panel title="Editor"><Empty text="Select a gallery." /></Panel>
      ) : (
        <Panel
          title={gal.title}
          sub={`${gal.items.length} items · /${gal.slug}`}
          right={
            <div className="flex items-center gap-3">
              <Tog on={gal.visible} onChange={(v) => void patch(gal.id, { visible: v })} label="Toggle visibility" />
              <Btn kind="danger" onClick={() => { if (window.confirm(`Delete “${gal.title}”?`)) { void opsFetch(`/api/admin/galleries?id=${gal.id}`, { method: "DELETE" }).then(() => { setGals((prev) => prev.filter((x) => x.id !== gal.id)); setActive(null); }); } }}>Delete</Btn>
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <F label="Title"><Inp value={gal.title} onChange={(e) => setGals((prev) => prev.map((x) => (x.id === gal.id ? { ...x, title: e.target.value } : x)))} onBlur={(e) => void patch(gal.id, { title: e.target.value }, true)} /></F>
            <F label="Layout">
              <div className="flex gap-2">
                {(["grid", "scroll"] as const).map((l) => (
                  <button key={l} onClick={() => void patch(gal.id, { layout: l }, true)} className={`flex-1 border px-3 py-2 font-mono text-[12px] uppercase ${gal.layout === l ? "border-amber-300/60 text-amber-200" : "border-white/15 text-stone-400"}`}>
                    {l === "grid" ? "Grid + lightbox" : "Horizontal scroll"}
                  </button>
                ))}
              </div>
            </F>
          </div>
          <div className="mt-3">
            <F label="Description"><Inp value={gal.description} onChange={(e) => setGals((prev) => prev.map((x) => (x.id === gal.id ? { ...x, description: e.target.value } : x)))} onBlur={(e) => void patch(gal.id, { description: e.target.value }, true)} /></F>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gal.items.map((item, i) => (
              <div key={i} className="border border-white/10 bg-black/20">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {item.kind === "video" ? (
                    <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="p-2.5">
                  <Inp value={item.caption ?? ""} placeholder="Caption…" onChange={(e) => { const items = gal.items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)); setGals((prev) => prev.map((x) => (x.id === gal.id ? { ...x, items } : x))); }} onBlur={() => void patch(gal.id, { items: gal.items }, true)} className="!py-1.5 text-[13px]" />
                  <div className="mt-2 flex justify-between">
                    <div className="flex gap-1">
                      <Btn onClick={() => moveItem(i, -1)}>←</Btn>
                      <Btn onClick={() => moveItem(i, 1)}>→</Btn>
                    </div>
                    <Btn kind="danger" onClick={() => void patch(gal.id, { items: gal.items.filter((_, j) => j !== i) }, true)}>Remove</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">Add by URL</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
              <Inp placeholder="/uploads/… or https://…" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} />
              <Inp placeholder="Caption" value={addCaption} onChange={(e) => setAddCaption(e.target.value)} />
              <Btn
                kind="primary"
                onClick={() => {
                  if (!addUrl.trim()) return;
                  const kind = addUrl.match(/\.(mp4)(\?|$)/) ? "video" : "image";
                  void patch(gal.id, { items: [...gal.items, { mediaId: null, url: addUrl.trim(), caption: addCaption.trim(), kind }] }, true);
                  setAddUrl("");
                  setAddCaption("");
                }}
              >
                + Add
              </Btn>
            </div>
            {media.length > 0 && (
              <>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">Or pick from media library</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                  {media.slice(0, 24).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => void patch(gal.id, { items: [...gal.items, { mediaId: m.id, url: m.url, caption: "", kind: m.mime.startsWith("video") ? "video" : "image" }] }, true)}
                      className="h-16 w-24 shrink-0 overflow-hidden border border-white/10 hover:border-amber-300/60"
                      title="Add to gallery"
                    >
                      {m.mime.startsWith("video") ? (
                        <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
