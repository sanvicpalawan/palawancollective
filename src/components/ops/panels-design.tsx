"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DesignTokens } from "@/db/schema";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { assertFunctionUploadSize, prepareImageForUpload } from "@/lib/image-upload";
import { DEFAULT_DESIGN, FONT_CHOICES, SHADOW_PRESETS, applyDesign, designCssVars, googleFontsHref } from "@/lib/design";
import { Btn, Empty, F, Inp, Panel, Sel, Tog, Txt } from "./console";

/* ------------------------------------------------------------------ */
/* Design System                                                           */
/* ------------------------------------------------------------------ */

const COLOR_FIELDS: Array<{ key: keyof DesignTokens["colors"]; label: string; main?: boolean }> = [
  { key: "primary", label: "Primary", main: true },
  { key: "secondary", label: "Secondary", main: true },
  { key: "accent", label: "Accent", main: true },
  { key: "background", label: "Background", main: true },
  { key: "text", label: "Text", main: true },
  { key: "sand", label: "Sand" },
  { key: "paper", label: "Paper" },
  { key: "ink", label: "Ink" },
  { key: "clay", label: "Clay" },
  { key: "clayDeep", label: "Clay deep" },
  { key: "clayLight", label: "Clay light" },
  { key: "moss", label: "Moss" },
];

const FONT_SLOTS: Array<{ key: keyof DesignTokens["fonts"]; label: string; sample: string }> = [
  { key: "display", label: "Display", sample: "PALAWAN 0123" },
  { key: "serif", label: "Serif", sample: "Dispatches from the field" },
  { key: "sans", label: "Sans", sample: "Systems that survive the habagat." },
  { key: "mono", label: "Mono", sample: "§ 02 · NO. 047 · PHT" },
  { key: "hand", label: "Hand", sample: "supply run, 06:10" },
];

export function DesignPanel() {
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tryOn, setTryOn] = useState(false);
  const { pushToast, setDesignDirty, designDirty } = useOpsStore();

  useEffect(() => {
    opsJson<{ design: DesignTokens }>("/api/admin/design")
      .then((d) => setTokens(d.design))
      .catch((e: Error) => pushToast("err", e.message));
  }, [pushToast]);

  // Load selected Google Fonts for the preview.
  useEffect(() => {
    if (!tokens) return;
    const href = googleFontsHref(tokens.fonts);
    if (!href) return;
    let link = document.getElementById("pc-fonts-preview") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "pc-fonts-preview";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [tokens?.fonts]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Try on this screen" — safe subset (no root font-size / spacing shift).
  useEffect(() => {
    if (!tryOn || !tokens) return;
    const root = document.documentElement;
    const prev: Record<string, string> = {};
    const vars = designCssVars(tokens);
    for (const [k, v] of Object.entries(vars)) {
      if (k === "--spacing") continue;
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, v);
    }
    return () => {
      for (const [k, v] of Object.entries(prev)) {
        if (v) root.style.setProperty(k, v);
        else root.style.removeProperty(k);
      }
    };
  }, [tryOn, tokens]);

  function update(patch: Partial<DesignTokens>) {
    setTokens((t) => (t ? { ...t, ...patch } : t));
    setDesignDirty(true);
  }

  async function save() {
    if (!tokens) return;
    setSaving(true);
    try {
      const d = await opsJson<{ design: DesignTokens }>("/api/admin/design", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens }),
      });
      setTokens(d.design);
      setDesignDirty(false);
      pushToast("ok", "Design applied — live across the site.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const previewVars = useMemo(() => (tokens ? designCssVars(tokens) : {}), [tokens]);

  if (!tokens) return <Empty text="Loading design tokens…" />;

  return (
    <div className="space-y-5">
      {tryOn && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-amber-300/50 bg-amber-400/10 px-4 py-3">
          <p className="font-mono text-[12px] text-amber-200">Previewing draft on this screen (colors + fonts + radius + shadow). Type & space scale apply on save.</p>
          <Btn onClick={() => setTryOn(false)}>Revert preview</Btn>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Live preview"
          sub="Updates as you edit"
          right={
            <div className="flex gap-2">
              <Btn onClick={() => setTryOn((v) => !v)}>{tryOn ? "Stop trying" : "Try on screen"}</Btn>
              <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-white/15 px-3.5 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-stone-200 hover:text-white">
                Open site ↗
              </a>
            </div>
          }
        >
          <div style={previewVars as React.CSSProperties} className="border border-white/10 p-6" id="design-preview">
            <div style={{ background: tokens.colors.sand, color: tokens.colors.text }} className="p-6">
              <p style={{ fontFamily: `"${tokens.fonts.mono}", monospace`, color: tokens.colors.accent }} className="text-[11px] uppercase tracking-[0.2em]">
                § 02 — Stories
              </p>
              <p style={{ fontFamily: `"${tokens.fonts.display}", sans-serif` }} className="mt-2 text-5xl uppercase leading-[0.9]">
                Palawan
              </p>
              <p style={{ fontFamily: `"${tokens.fonts.serif}", serif` }} className="mt-3 text-xl italic">
                Dispatches from building off-grid.
              </p>
              <p style={{ fontFamily: `"${tokens.fonts.sans}", sans-serif` }} className="mt-2 max-w-md text-[14px] leading-relaxed">
                Solar, water systems and remote logistics — documented weekly from the site.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  style={{ background: tokens.colors.ink, color: tokens.colors.sand, borderRadius: tokens.radius, boxShadow: SHADOW_PRESETS[tokens.shadow], fontFamily: `"${tokens.fonts.mono}", monospace` }}
                  className="px-4 py-2.5 text-[11px] uppercase tracking-[0.15em]"
                >
                  Read the stories →
                </span>
                <span
                  style={{ border: `1px solid ${tokens.colors.text}`, borderRadius: tokens.radius, fontFamily: `"${tokens.fonts.mono}", monospace` }}
                  className="px-4 py-2.5 text-[11px] uppercase tracking-[0.15em]"
                >
                  Explore
                </span>
              </div>
              <p style={{ fontFamily: `"${tokens.fonts.hand}", cursive`, color: tokens.colors.secondary }} className="mt-4 text-2xl">
                supply run, 06:10
              </p>
            </div>
            <p className="mt-3 font-mono text-[11px] text-stone-500">
              type ×{tokens.fontScale.toFixed(2)} · space ×{tokens.spacingScale.toFixed(2)} · radius {tokens.radius}px · shadow {tokens.shadow}
            </p>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Type scale · space · shape" sub="Applied instantly on save">
            <div className="grid gap-4 sm:grid-cols-2">
              <F label={`Font size ×${tokens.fontScale.toFixed(2)}`}>
                <input type="range" min={0.8} max={1.4} step={0.05} value={tokens.fontScale} onChange={(e) => update({ fontScale: Number(e.target.value) })} className="ops-range" />
              </F>
              <F label={`Spacing ×${tokens.spacingScale.toFixed(2)}`}>
                <input type="range" min={0.8} max={1.4} step={0.05} value={tokens.spacingScale} onChange={(e) => update({ spacingScale: Number(e.target.value) })} className="ops-range" />
              </F>
              <F label={`Radius ${tokens.radius}px`}>
                <input type="range" min={0} max={28} step={1} value={tokens.radius} onChange={(e) => update({ radius: Number(e.target.value) })} className="ops-range" />
              </F>
              <F label="Shadow">
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(SHADOW_PRESETS) as DesignTokens["shadow"][]).map((s) => (
                    <button key={s} onClick={() => update({ shadow: s })} className={`border px-2 py-2 font-mono text-[11px] uppercase ${tokens.shadow === s ? "border-amber-300/60 text-amber-200" : "border-white/15 text-stone-400"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </F>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn kind="primary" disabled={saving || !designDirty} onClick={() => void save()}>{saving ? "Applying…" : "Apply live"}</Btn>
              <Btn
                kind="danger"
                onClick={() => {
                  if (!window.confirm("Reset the whole design to defaults?")) return;
                  setTokens(structuredClone(DEFAULT_DESIGN));
                  setDesignDirty(true);
                }}
              >
                Reset
              </Btn>
              {!designDirty && <span className="self-center font-mono text-[11px] text-stone-500">no unsaved changes</span>}
            </div>
          </Panel>

          <Panel title="Colors" sub="Tap a swatch or paste hex">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {COLOR_FIELDS.filter((f) => f.main || showAll).map((f) => (
                <div key={f.key} className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={tokens.colors[f.key]}
                    onChange={(e) => update({ colors: { ...tokens.colors, [f.key]: e.target.value } })}
                    className="h-9 w-11 shrink-0 cursor-pointer border border-white/20 bg-transparent p-0.5"
                    aria-label={f.label}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-stone-400">{f.label}</p>
                    <Inp
                      value={tokens.colors[f.key]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) update({ colors: { ...tokens.colors, [f.key]: v.length === 7 ? v : tokens.colors[f.key] } });
                      }}
                      className="!py-1 font-mono !text-[12px]"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAll((v) => !v)} className="mt-3 font-mono text-[12px] text-stone-400 hover:text-white">
              {showAll ? "− hide extended palette" : "+ extended palette (sand · paper · clay · moss)"}
            </button>
          </Panel>
        </div>
      </div>

      <Panel title="Fonts" sub="Google Fonts · preview loads instantly">
        <div className="grid gap-4 lg:grid-cols-2">
          {FONT_SLOTS.map((slot) => (
            <div key={slot.key} className="border border-white/10 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{slot.label}</p>
              <p style={{ fontFamily: `"${tokens.fonts[slot.key]}", sans-serif` }} className="mt-2 truncate text-2xl text-white">
                {slot.sample}
              </p>
              <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
                <Sel value={FONT_CHOICES[slot.key].includes(tokens.fonts[slot.key]) ? tokens.fonts[slot.key] : "__custom"} onChange={(e) => e.target.value !== "__custom" && update({ fonts: { ...tokens.fonts, [slot.key]: e.target.value } })}>
                  {!FONT_CHOICES[slot.key].includes(tokens.fonts[slot.key]) && <option value="__custom">Custom…</option>}
                  {FONT_CHOICES[slot.key].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Sel>
                <Inp
                  placeholder="Custom family…"
                  value={FONT_CHOICES[slot.key].includes(tokens.fonts[slot.key]) ? "" : tokens.fonts[slot.key]}
                  onChange={(e) => e.target.value.trim() && update({ fonts: { ...tokens.fonts, [slot.key]: e.target.value } })}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[11px] text-stone-500">
          Families load from Google Fonts on the live site. Stick to real family names — unknown names fall back silently.
        </p>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Media Library                                                           */
/* ------------------------------------------------------------------ */

type MediaRow = {
  id: number; filename: string; url: string; mime: string; size: number;
  width: number | null; height: number | null; tags: string[]; createdAt: string;
};

function fmtSize(bytes: number): string {
  if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function MediaPanel() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("");
  const [kind, setKind] = useState<"all" | "image" | "video">("all");
  const [editingTags, setEditingTags] = useState<number | null>(null);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ media: MediaRow[] }>("/api/admin/media");
      setRows(d.media);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // Vercel caps the complete request body at 4.5 MB. Upload separately so
      // several small photos can't combine into one rejected request.
      let saved = 0;
      for (const original of Array.from(files).slice(0, 10)) {
        const file = original.type.startsWith("image/")
          ? await prepareImageForUpload(original)
          : original;
        assertFunctionUploadSize(file);
        const form = new FormData();
        form.append("files", file);
        form.append("tags", tags);
        const res = await opsFetch("/api/admin/media", { method: "POST", body: form });
        const d = (await res.json().catch(() => ({}))) as { ok?: boolean; saved?: unknown[]; error?: string };
        if (!res.ok || !d.ok) throw new Error(d.error || `Upload failed (${res.status}).`);
        saved += d.saved?.length ?? 0;
      }
      pushToast("ok", `${saved} file(s) optimized and saved to the database.`);
      setTags("");
      void load();
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const filtered = rows.filter(
    (r) =>
      (kind === "all" || (kind === "image" ? r.mime.startsWith("image") : r.mime.startsWith("video"))) &&
      (!filter || r.filename.includes(filter.toLowerCase()) || r.tags.some((t) => t.includes(filter.toLowerCase()))),
  );

  return (
    <div className="space-y-5">
      <Panel title="Upload" sub="Images auto-compress for Vercel · MP4 ≤3.5MB per file · saved in Postgres">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 cursor-pointer items-center justify-center border border-dashed border-white/25 px-4 py-6 font-mono text-[13px] text-stone-300 hover:border-amber-300/60 hover:text-white">
            {uploading ? "Optimizing…" : "Drop files or click to browse (max 10)"}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <div className="sm:w-64">
            <F label="Tags (comma separated)" hint="Applied to every file in the batch.">
              <Inp value={tags} onChange={(e) => setTags(e.target.value)} placeholder="site-01, solar, crew" />
            </F>
          </div>
        </div>
      </Panel>

      <Panel
        title={`Library · ${filtered.length}`}
        sub="Copy a URL into any section or gallery — or pick from the gallery editor"
        right={
          <div className="flex gap-2">
            <Inp placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} className="!w-36" />
            <Sel value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="!w-auto">
              <option value="all">all</option>
              <option value="image">images</option>
              <option value="video">video</option>
            </Sel>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <Empty text="Library is empty — or nothing matches." />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m) => (
              <div key={m.id} className="border border-white/10 bg-black/20">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-800">
                  {m.mime.startsWith("video") ? (
                    <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                  <span className="absolute left-1.5 top-1.5 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] uppercase text-stone-200">
                    {m.mime.startsWith("video") ? "mp4" : m.mime.split("/")[1]}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="truncate font-mono text-[11px] text-stone-300" title={m.filename}>{m.filename}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-stone-500">
                    {fmtSize(m.size)}{m.width ? ` · ${m.width}×${m.height}` : ""}
                  </p>
                  {editingTags === m.id ? (
                    <TagEditor
                      tags={m.tags}
                      onSave={(next) => {
                        opsFetch(`/api/admin/media?id=${m.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags: next }) })
                          .then(() => {
                            setRows((prev) => prev.map((x) => (x.id === m.id ? { ...x, tags: next } : x)));
                            setEditingTags(null);
                          })
                          .catch(() => pushToast("err", "Tag save failed."));
                      }}
                    />
                  ) : (
                    <button onClick={() => setEditingTags(m.id)} className="mt-1.5 block min-h-5 w-full truncate text-left font-mono text-[11px] text-amber-200/80 hover:text-amber-200">
                      {m.tags.length > 0 ? m.tags.map((t) => `#${t}`).join(" ") : "+ tag"}
                    </button>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    <Btn
                      onClick={() => {
                        void navigator.clipboard.writeText(m.url).then(
                          () => pushToast("ok", "URL copied."),
                          () => pushToast("err", "Copy failed."),
                        );
                      }}
                    >
                      URL
                    </Btn>
                    <Btn kind="danger" onClick={() => { if (window.confirm("Delete this file? Galleries using it will break.")) { void opsFetch(`/api/admin/media?id=${m.id}`, { method: "DELETE" }).then(() => setRows((prev) => prev.filter((x) => x.id !== m.id))).catch(() => pushToast("err", "Delete failed.")); } }}>
                      ✕
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function TagEditor({ tags, onSave }: { tags: string[]; onSave: (t: string[]) => void }) {
  const [value, setValue] = useState(tags.join(", "));
  return (
    <div className="mt-1.5 flex gap-1.5">
      <Inp value={value} onChange={(e) => setValue(e.target.value)} className="!py-1 !text-[12px]" placeholder="tag1, tag2" />
      <Btn kind="ok" onClick={() => onSave(value.split(",").map((t) => t.trim()).filter(Boolean))}>✓</Btn>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Site Settings                                                           */
/* ------------------------------------------------------------------ */

const SETTING_GROUPS: Array<{ title: string; keys: Array<{ key: string; label: string; multiline?: boolean; kind?: "text" | "bool" }> }> = [
  {
    title: "Identity",
    keys: [
      { key: "site_name", label: "Site name" },
      { key: "tagline", label: "Tagline", multiline: true },
      { key: "positioning", label: "Positioning line", multiline: true },
    ],
  },
  {
    title: "Hero",
    keys: [
      { key: "hero_kicker", label: "Kicker" },
      { key: "hero_name", label: "Name" },
      { key: "hero_role", label: "Role line" },
      { key: "hero_intro", label: "Intro paragraph", multiline: true },
    ],
  },
  {
    title: "Operator chat",
    keys: [
      { key: "chat_enabled", label: "Enabled", kind: "bool" },
      { key: "chat_title", label: "Chat title" },
      { key: "chat_greeting", label: "Greeting", multiline: true },
    ],
  },
  {
    title: "Footer",
    keys: [{ key: "footer_note", label: "Footer note" }],
  },
];

type Inq = { id: number; kind: string; name: string; email: string; focus: string; message: string; status: string; createdAt: string };

export function SettingsPanel() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [inqs, setInqs] = useState<Inq[]>([]);
  const [openInq, setOpenInq] = useState<number | null>(null);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([
        opsJson<{ settings: Record<string, unknown> }>("/api/admin/settings"),
        opsJson<{ inquiries: Inq[] }>("/api/admin/inquiries"),
      ]);
      setSettings(s.settings);
      setInqs(o.inquiries);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    try {
      await opsJson("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: settings }) });
      pushToast("ok", "Settings saved — live now.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function markInquiry(id: number, status: string) {
    try {
      const res = await opsFetch(`/api/admin/inquiries?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed.");
      setInqs((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Update failed.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        {SETTING_GROUPS.map((g) => (
          <Panel key={g.title} title={g.title}>
            <div className="space-y-3">
              {g.keys.map((f) => (
                <F key={f.key} label={f.label}>
                  {f.kind === "bool" ? (
                    <Tog on={settings[f.key] !== false} onChange={(v) => setSettings({ ...settings, [f.key]: v })} label={f.label} />
                  ) : f.multiline ? (
                    <Txt rows={3} value={typeof settings[f.key] === "string" ? (settings[f.key] as string) : ""} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })} />
                  ) : (
                    <Inp value={typeof settings[f.key] === "string" ? (settings[f.key] as string) : ""} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })} />
                  )}
                </F>
              ))}
            </div>
          </Panel>
        ))}
        <Btn kind="primary" onClick={() => void save()}>Save all settings</Btn>
      </div>

      <Panel title={`Inquiries · ${inqs.length}`} sub="Newest first · mark read as you reply">
        <div className="space-y-2">
          {inqs.map((q) => (
            <div key={q.id} className="border border-white/10">
              <button onClick={() => setOpenInq(openInq === q.id ? null : q.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                <span className={`shrink-0 px-2 py-0.5 font-mono text-[10px] uppercase ${q.status === "new" ? "bg-amber-400/15 text-amber-200" : "bg-white/5 text-stone-400"}`}>
                  {q.status}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-stone-100">{q.name} · {q.focus}</span>
                  <span className="block truncate font-mono text-[11px] text-stone-500">{q.email}</span>
                </span>
              </button>
              {openInq === q.id && (
                <div className="border-t border-white/10 p-3">
                  <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-stone-200">{q.message}</p>
                  <div className="mt-3 flex gap-2">
                    <a href={`mailto:${q.email}`} className="inline-flex items-center border border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase text-stone-200 hover:text-white">Reply</a>
                    {q.status === "new" && <Btn onClick={() => void markInquiry(q.id, "read")}>Mark read</Btn>}
                    {q.status !== "archived" && <Btn onClick={() => void markInquiry(q.id, "archived")}>Archive</Btn>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {inqs.length === 0 && <Empty text="No inquiries yet." />}
        </div>
      </Panel>
    </div>
  );
}
