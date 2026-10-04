"use client";

import { useEffect, useState, type ReactNode } from "react";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { prepareImageForUpload } from "@/lib/image-upload";
import { Btn, Empty, F, Inp, Panel, Sel, Tog, Txt } from "./console";

/* ------------------------------------------------------------------ */
/* Field vocabulary                                                     */
/* ------------------------------------------------------------------ */

export type Field =
  | { k: "text"; key: string; label: string; hint?: string }
  | { k: "area"; key: string; label: string; rows?: number; hint?: string }
  | { k: "num"; key: string; label: string; hint?: string }
  | { k: "date"; key: string; label: string }
  | { k: "bool"; key: string; label: string }
  | { k: "image"; key: string; label: string }
  | { k: "select"; key: string; label: string; options: string[] }
  | { k: "list"; key: string; label: string; placeholder?: string; hint?: string }
  | { k: "kv"; key: string; label: string; hint?: string }
  | { k: "sections"; key: string; label: string; withItems?: boolean }
  | { k: "blocks"; key: string; label: string };

export type Row = { id: number } & Record<string, unknown>;

type Config = {
  endpoint: string;
  title: string;
  sub: string;
  singular: string;
  fields: Field[];
  defaults: () => Record<string, unknown>;
  /** Big text shown in the collapsed list row. */
  rowTitle: (r: Row) => string;
  rowMeta?: (r: Row) => string;
  /** Optional per-row toggle (e.g. "featured"). */
  rowFlag?: { key: string; label: string };
};

/* ------------------------------------------------------------------ */
/* Small editors used by more than one panel                            */
/* ------------------------------------------------------------------ */

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function ListEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <Inp
            value={item}
            placeholder={placeholder}
            aria-label={`Item ${i + 1}`}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <Btn onClick={() => onChange(move(items, i, -1))} title="Move up">↑</Btn>
          <Btn onClick={() => onChange(move(items, i, 1))} title="Move down">↓</Btn>
          <Btn kind="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove">✕</Btn>
        </div>
      ))}
      <Btn onClick={() => onChange([...items, ""])}>+ Add item</Btn>
    </div>
  );
}

function KvEditor({ value, onChange }: { value: Array<{ label: string; value: string }>; onChange: (v: Array<{ label: string; value: string }>) => void }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <Inp
            value={item.label}
            placeholder="Label"
            aria-label={`Label ${i + 1}`}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            className="!w-40"
          />
          <Inp
            value={item.value}
            placeholder="Value"
            aria-label={`Value ${i + 1}`}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
          />
          <Btn onClick={() => onChange(move(items, i, -1))} title="Move up">↑</Btn>
          <Btn onClick={() => onChange(move(items, i, 1))} title="Move down">↓</Btn>
          <Btn kind="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove">✕</Btn>
        </div>
      ))}
      <Btn onClick={() => onChange([...items, { label: "", value: "" }])}>+ Add row</Btn>
    </div>
  );
}

type SectionRow = { heading: string; body: string[]; items?: string[] };

function SectionsEditor({
  value,
  onChange,
  withItems,
}: {
  value: SectionRow[];
  onChange: (v: SectionRow[]) => void;
  withItems?: boolean;
}) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-3">
      {items.map((sec, i) => (
        <div key={i} className="border border-white/10 bg-black/20 p-3">
          <div className="flex gap-1.5">
            <Inp
              value={sec.heading}
              placeholder="Section heading"
              aria-label={`Heading ${i + 1}`}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))}
            />
            <Btn onClick={() => onChange(move(items, i, -1))} title="Move up">↑</Btn>
            <Btn onClick={() => onChange(move(items, i, 1))} title="Move down">↓</Btn>
            <Btn kind="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove section">✕</Btn>
          </div>

          <div className="mt-2">
            <F label="Paragraphs" hint="One paragraph per row.">
              <ListEditor
                value={Array.isArray(sec.body) ? sec.body : []}
                placeholder="Paragraph text…"
                onChange={(body) => onChange(items.map((x, j) => (j === i ? { ...x, body } : x)))}
              />
            </F>
          </div>

          {withItems && (
            <div className="mt-2">
              <F label="Bullet points (optional)">
                <ListEditor
                  value={Array.isArray(sec.items) ? sec.items : []}
                  placeholder="Bullet…"
                  onChange={(list) => onChange(items.map((x, j) => (j === i ? { ...x, items: list.filter(Boolean) } : x)))}
                />
              </F>
            </div>
          )}
        </div>
      ))}
      <Btn onClick={() => onChange([...items, { heading: "", body: [""] }])}>+ Add section</Btn>
    </div>
  );
}

type Block = { type: string } & Record<string, unknown>;

const BLOCK_LABEL: Record<string, string> = {
  p: "Paragraph",
  h2: "Heading",
  quote: "Quote",
  list: "List",
  log: "Field log",
  callout: "Callout",
};

function BlocksEditor({ value, onChange }: { value: Block[]; onChange: (v: Block[]) => void }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-3">
      {items.map((b, i) => (
        <div key={i} className="border border-white/10 bg-black/20 p-3">
          <div className="flex gap-1.5">
            <Sel
              value={b.type}
              aria-label={`Block ${i + 1} type`}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
              className="!w-44"
            >
              {Object.entries(BLOCK_LABEL).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </Sel>
            <span className="flex-1" />
            <Btn onClick={() => onChange(move(items, i, -1))} title="Move up">↑</Btn>
            <Btn onClick={() => onChange(move(items, i, 1))} title="Move down">↓</Btn>
            <Btn kind="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove block">✕</Btn>
          </div>

          <div className="mt-2 space-y-2">
            {(b.type === "p" || b.type === "h2") && (
              <Txt
                rows={b.type === "h2" ? 2 : 5}
                value={typeof b.text === "string" ? b.text : ""}
                aria-label="Text"
                onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              />
            )}

            {b.type === "quote" && (
              <>
                <Txt rows={3} value={typeof b.text === "string" ? b.text : ""} aria-label="Quote" placeholder="Quote…" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                <Inp value={typeof b.cite === "string" ? b.cite : ""} placeholder="Attribution (optional)" aria-label="Attribution" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, cite: e.target.value } : x)))} />
              </>
            )}

            {b.type === "callout" && (
              <>
                <Inp value={typeof b.label === "string" ? b.label : ""} placeholder="Label — e.g. What broke" aria-label="Callout label" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <Txt rows={3} value={typeof b.text === "string" ? b.text : ""} aria-label="Callout text" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              </>
            )}

            {b.type === "list" && (
              <ListEditor
                value={Array.isArray(b.items) ? (b.items as string[]) : []}
                placeholder="List item…"
                onChange={(list) => onChange(items.map((x, j) => (j === i ? { ...x, items: list } : x)))}
              />
            )}

            {b.type === "log" && (
              <>
                <Inp value={typeof b.title === "string" ? b.title : ""} placeholder="Log title (optional)" aria-label="Log title" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <LogEditor
                  value={Array.isArray(b.entries) ? (b.entries as Array<{ time: string; text: string }>) : []}
                  onChange={(entries) => onChange(items.map((x, j) => (j === i ? { ...x, entries } : x)))}
                />
              </>
            )}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(BLOCK_LABEL).map(([k, l]) => (
          <Btn key={k} onClick={() => onChange([...items, { type: k, text: "", items: [], entries: [], label: "" }])}>
            + {l}
          </Btn>
        ))}
      </div>
    </div>
  );
}

function LogEditor({ value, onChange }: { value: Array<{ time: string; text: string }>; onChange: (v: Array<{ time: string; text: string }>) => void }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-1.5">
      {items.map((e, i) => (
        <div key={i} className="flex gap-1.5">
          <Inp value={e.time} placeholder="14:20" aria-label="Time" onChange={(ev) => onChange(items.map((x, j) => (j === i ? { ...x, time: ev.target.value } : x)))} className="!w-24" />
          <Inp value={e.text} placeholder="What happened…" aria-label="Entry" onChange={(ev) => onChange(items.map((x, j) => (j === i ? { ...x, text: ev.target.value } : x)))} />
          <Btn kind="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove">✕</Btn>
        </div>
      ))}
      <Btn onClick={() => onChange([...items, { time: "", text: "" }])}>+ Add entry</Btn>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Image field — URL box + upload + library strip                       */
/* ------------------------------------------------------------------ */

type MediaRow = { id: number; url: string; mime: string; filename: string };

function ImageField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const { pushToast } = useOpsStore();

  useEffect(() => {
    opsJson<{ media: MediaRow[] }>("/api/admin/media")
      .then((d) => setMedia(d.media))
      .catch(() => undefined);
  }, []);

  async function upload(file: File | null | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const form = new FormData();
      form.append("files", prepared);
      const res = await opsFetch("/api/admin/media", { method: "POST", body: form });
      const d = (await res.json()) as { ok?: boolean; saved?: Array<{ url: string }>; error?: string };
      if (!res.ok || !d.ok || !d.saved?.[0]) throw new Error(d.error || "Upload failed.");
      onChange(d.saved[0].url);
      const m = await opsJson<{ media: MediaRow[] }>("/api/admin/media");
      setMedia(m.media);
      pushToast("ok", "Image uploaded.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const images = media.filter((m) => m.mime.startsWith("image"));

  return (
    <F label={label} hint={hint}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-14 w-20 shrink-0 overflow-hidden border border-white/10 bg-stone-800">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <Inp value={value} placeholder="/images/… or /uploads/…" aria-label={label} onChange={(e) => onChange(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center border border-white/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-stone-200 hover:border-white/35">
            {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <span className="font-mono text-[11px] text-stone-500">or pick:</span>
        </div>
        {images.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {images.slice(0, 30).map((m) => (
              <button
                key={m.id}
                type="button"
                title={m.filename}
                onClick={() => onChange(m.url)}
                className={`h-12 w-16 shrink-0 overflow-hidden border ${value === m.url ? "border-amber-300" : "border-white/10 hover:border-amber-300/60"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </F>
  );
}

/* ------------------------------------------------------------------ */
/* The panel                                                            */
/* ------------------------------------------------------------------ */

function toLocalInput(v: unknown): string {
  const d = new Date(typeof v === "string" ? v : "");
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function EntityPanel({ config }: { config: Config }) {
  const { endpoint, title, sub, singular, fields, defaults, rowTitle, rowMeta, rowFlag } = config;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const { pushToast } = useOpsStore();

  useEffect(() => {
    let live = true;
    opsJson<{ rows: Row[] }>(endpoint)
      .then((d) => {
        if (!live) return;
        setRows(d.rows);
        setLoading(false);
      })
      .catch((e) => {
        if (!live) return;
        setLoading(false);
        pushToast("err", e instanceof Error ? e.message : "Load failed.");
      });
    return () => {
      live = false;
    };
  }, [endpoint, pushToast]);

  const open = (r: Row) => {
    setEditing(r.id);
    setDraft({ ...r });
    setAdding(false);
  };

  async function save() {
    if (!draft) return;
    const payload: Record<string, unknown> = { ...draft };
    delete payload.id;
    delete payload.createdAt;
    try {
      const d = await opsJson<{ row: Row }>(`${endpoint}?id=${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setRows((prev) => prev.map((r) => (r.id === d.row.id ? d.row : r)));
      setEditing(null);
      setDraft(null);
      pushToast("ok", "Saved — live on next page load.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function create() {
    try {
      const d = await opsJson<{ row: Row }>(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults()),
      });
      setRows((prev) => [d.row, ...prev]);
      setAdding(false);
      setEditing(d.row.id);
      setDraft(d.row);
      pushToast("ok", `${singular} created.`);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Create failed.");
    }
  }

  async function remove(r: Row) {
    if (!window.confirm(`Delete “${rowTitle(r)}”? This can be restored from Version history.`)) return;
    try {
      await opsFetch(`${endpoint}?id=${r.id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      if (editing === r.id) {
        setEditing(null);
        setDraft(null);
      }
      pushToast("ok", `${singular} deleted.`);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function patch(r: Row, body: Record<string, unknown>) {
    try {
      const d = await opsJson<{ row: Row }>(`${endpoint}?id=${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setRows((prev) => prev.map((x) => (x.id === d.row.id ? d.row : x)));
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  const setField = (key: string, value: unknown) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  function renderField(f: Field): ReactNode {
    if (!draft) return null;
    const v = draft[f.key];
    switch (f.k) {
      case "text":
        return <F key={f.key} label={f.label} hint={f.hint}><Inp value={typeof v === "string" ? v : ""} aria-label={f.label} onChange={(e) => setField(f.key, e.target.value)} /></F>;
      case "area":
        return <F key={f.key} label={f.label} hint={f.hint}><Txt rows={f.rows ?? 3} value={typeof v === "string" ? v : ""} aria-label={f.label} onChange={(e) => setField(f.key, e.target.value)} /></F>;
      case "num":
        return <F key={f.key} label={f.label} hint={f.hint}><Inp type="number" value={typeof v === "number" ? v : 0} aria-label={f.label} onChange={(e) => setField(f.key, Number(e.target.value))} /></F>;
      case "date":
        return <F key={f.key} label={f.label}><Inp type="datetime-local" value={toLocalInput(v)} aria-label={f.label} onChange={(e) => setField(f.key, e.target.value)} /></F>;
      case "bool":
        return (
          <F key={f.key} label={f.label}>
            <span className="flex items-center gap-3 pt-1">
              <Tog on={v === true} onChange={(nv) => setField(f.key, nv)} label={f.label} />
              <span className="font-mono text-[12px] text-stone-400">{v === true ? "on" : "off"}</span>
            </span>
          </F>
        );
      case "select":
        return (
          <F key={f.key} label={f.label}>
            <Sel value={typeof v === "string" ? v : f.options[0]} aria-label={f.label} onChange={(e) => setField(f.key, e.target.value)}>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </Sel>
          </F>
        );
      case "image":
        return <ImageField key={f.key} label={f.label} value={typeof v === "string" ? v : ""} onChange={(nv) => setField(f.key, nv)} />;
      case "list":
        return <F key={f.key} label={f.label} hint={f.hint}><ListEditor value={Array.isArray(v) ? (v as string[]) : []} placeholder={f.placeholder} onChange={(nv) => setField(f.key, nv)} /></F>;
      case "kv":
        return <F key={f.key} label={f.label} hint={f.hint}><KvEditor value={Array.isArray(v) ? (v as Array<{ label: string; value: string }>) : []} onChange={(nv) => setField(f.key, nv)} /></F>;
      case "sections":
        return <F key={f.key} label={f.label}><SectionsEditor withItems={f.withItems} value={Array.isArray(v) ? (v as SectionRow[]) : []} onChange={(nv) => setField(f.key, nv)} /></F>;
      case "blocks":
        return <F key={f.key} label={f.label}><BlocksEditor value={Array.isArray(v) ? (v as Block[]) : []} onChange={(nv) => setField(f.key, nv)} /></F>;
    }
  }

  const twoCol = new Set(["text", "num", "date", "bool", "select"]);
  const left = fields.filter((f) => twoCol.has(f.k));
  const full = fields.filter((f) => !twoCol.has(f.k));

  return (
    <div className="space-y-5">
      <Panel
        title={title}
        sub={sub}
        right={<Btn kind="primary" onClick={() => { setAdding(true); setEditing(null); setDraft(null); }}>+ New {singular}</Btn>}
      >
        {adding && (
          <div className="mb-4 border border-amber-300/40 bg-amber-400/5 p-4">
            <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.16em] text-amber-200">New {singular} — fill in and save</p>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setAdding(false)}>Cancel</Btn>
              <Btn kind="primary" onClick={() => void create()}>Create</Btn>
            </div>
          </div>
        )}

        {loading ? (
          <Empty text="Loading…" />
        ) : rows.length === 0 ? (
          <Empty text={`No ${title.toLowerCase()} yet.`} />
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className={`border bg-white/[0.02] ${editing === r.id ? "border-amber-300/50" : "border-white/10"}`}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {rowFlag && (
                    <Tog
                      on={r[rowFlag.key] === true}
                      label={rowFlag.label}
                      onChange={(nv) => void patch(r, { [rowFlag.key]: nv })}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => (editing === r.id ? (setEditing(null), setDraft(null)) : open(r))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[14px] text-stone-100 hover:text-amber-200">{rowTitle(r)}</span>
                    {rowMeta && (
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-stone-500">{rowMeta(r)}</span>
                    )}
                  </button>
                  <Btn onClick={() => (editing === r.id ? (setEditing(null), setDraft(null)) : open(r))}>
                    {editing === r.id ? "Close" : "Edit"}
                  </Btn>
                  <Btn kind="danger" onClick={() => void remove(r)}>Delete</Btn>
                </div>

                {editing === r.id && draft && (
                  <div className="border-t border-white/10 p-4">
                    <div className="grid gap-3 md:grid-cols-2">{left.map(renderField)}</div>
                    <div className="mt-3 space-y-3">{full.map(renderField)}</div>
                    <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-3">
                      <Btn onClick={() => { setEditing(null); setDraft(null); }}>Cancel</Btn>
                      <Btn kind="primary" onClick={() => void save()}>Save</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
