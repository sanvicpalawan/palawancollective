"use client";

import { useEffect, useState } from "react";
import { opsJson, useOpsStore } from "@/lib/admin-store";
import { Btn, Empty, F, Inp, Panel, Txt } from "./console";

type SystemItem = { code: string; icon: string; title: string; detail: string; parts: string[] };
type ServiceItem = { id: string; number: string; title: string; qualifier?: string; summary: string; format: string; includes: string[] };
type Catalog = { systems: SystemItem[]; services: ServiceItem[] };

const ICONS = ["sun", "chat", "agent", "approve", "layers"];

function Chips({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <Inp
            value={item}
            placeholder={placeholder}
            aria-label={`Chip ${i + 1}`}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <Btn kind="danger" onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove">✕</Btn>
        </div>
      ))}
      <Btn onClick={() => onChange([...items, ""])}>+ Add</Btn>
    </div>
  );
}

/**
 * Two hand-editable collections that render the home "Systems" block and the
 * Work With Us service cards. Saved as settings, so the site falls back to the
 * shipped defaults whenever the database is unreachable.
 */
function CatalogPanelBase({ kind }: { kind: "systems" | "services" }) {
  const [data, setData] = useState<Catalog | null>(null);
  const [saving, setSaving] = useState(false);
  const { pushToast } = useOpsStore();

  useEffect(() => {
    opsJson<{ catalog: Catalog }>("/api/admin/catalog")
      .then((d) => setData(d.catalog))
      .catch((e) => pushToast("err", e instanceof Error ? e.message : "Load failed."));
  }, [pushToast]);

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      const d = await opsJson<{ catalog: Catalog }>("/api/admin/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setData(d.catalog);
      pushToast("ok", "Saved — live on next page load.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <Empty text="Loading…" />;

  const right = (
    <Btn kind="primary" disabled={saving} onClick={() => void save()}>
      {saving ? "Saving…" : "Save"}
    </Btn>
  );

  if (kind === "systems") {
    const items = data.systems;
    const set = (next: SystemItem[]) => setData({ ...data, systems: next });
    return (
      <Panel
        title="Systems"
        sub="The numbered capability list in the home “Systems We Build” block."
        right={
          <Btn onClick={() => set([...items, { code: `S/${String(items.length + 1).padStart(2, "0")}`, icon: "layers", title: "", detail: "", parts: [] }])}>
            + Add system
          </Btn>
        }
      >
        <div className="space-y-3">
          {items.map((s, i) => (
            <div key={i} className="border border-white/10 bg-black/20 p-4">
              <div className="grid gap-3 md:grid-cols-[7rem_8rem_1fr]">
                <F label="Code"><Inp value={s.code} aria-label="Code" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} /></F>
                <F label="Icon">
                  <select
                    value={s.icon}
                    aria-label="Icon"
                    onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}
                    className="ops-inp"
                  >
                    {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </F>
                <F label="Title"><Inp value={s.title} aria-label="Title" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></F>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <F label="Detail"><Txt rows={3} value={s.detail} aria-label="Detail" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))} /></F>
                <F label="Capability chips"><Chips value={s.parts} placeholder="e.g. Solar + LiFePO₄" onChange={(parts) => set(items.map((x, j) => (j === i ? { ...x, parts: parts.filter(Boolean) } : x)))} /></F>
              </div>
              <div className="mt-3 flex justify-between">
                <div className="flex gap-2">
                  <Btn disabled={i === 0} onClick={() => set(move(items, i, -1))}>↑</Btn>
                  <Btn disabled={i === items.length - 1} onClick={() => set(move(items, i, 1))}>↓</Btn>
                </div>
                <Btn kind="danger" onClick={() => { if (window.confirm(`Delete “${s.title}”?`)) set(items.filter((_, j) => j !== i)); }}>Delete</Btn>
              </div>
            </div>
          ))}
          {items.length === 0 && <Empty text="No systems yet." />}
        </div>
        <div className="mt-4 flex justify-end border-t border-white/10 pt-4">{right}</div>
      </Panel>
    );
  }

  const items = data.services;
  const set = (next: ServiceItem[]) => setData({ ...data, services: next });
  return (
    <Panel
      title="Work with us"
      sub="The four service cards on Home and /work-with-us."
      right={
        <Btn onClick={() => set([...items, { id: `service-${items.length + 1}`, number: String(items.length + 1).padStart(2, "0"), title: "", summary: "", format: "", includes: [] }])}>
          + Add service
        </Btn>
      }
    >
      <div className="space-y-3">
        {items.map((s, i) => (
          <div key={i} className="border border-white/10 bg-black/20 p-4">
            <div className="grid gap-3 md:grid-cols-[5rem_1fr_10rem]">
              <F label="Number"><Inp value={s.number} aria-label="Number" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))} /></F>
              <F label="Title"><Inp value={s.title} aria-label="Title" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></F>
              <F label="Qualifier (optional)"><Inp value={s.qualifier ?? ""} aria-label="Qualifier" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, qualifier: e.target.value } : x)))} /></F>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <F label="Summary"><Txt rows={3} value={s.summary} aria-label="Summary" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, summary: e.target.value } : x)))} /></F>
              <div className="space-y-3">
                <F label="Format line"><Inp value={s.format} placeholder="Remote + on-site · 2–6 weeks" aria-label="Format" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, format: e.target.value } : x)))} /></F>
                <F label="Includes"><Chips value={s.includes} placeholder="What’s included…" onChange={(includes) => set(items.map((x, j) => (j === i ? { ...x, includes: includes.filter(Boolean) } : x)))} /></F>
              </div>
            </div>
            <div className="mt-3 flex justify-between">
              <div className="flex gap-2">
                <Btn disabled={i === 0} onClick={() => set(move(items, i, -1))}>↑</Btn>
                <Btn disabled={i === items.length - 1} onClick={() => set(move(items, i, 1))}>↓</Btn>
              </div>
              <Btn kind="danger" onClick={() => { if (window.confirm(`Delete “${s.title}”?`)) set(items.filter((_, j) => j !== i)); }}>Delete</Btn>
            </div>
          </div>
        ))}
        {items.length === 0 && <Empty text="No services yet." />}
      </div>
      <div className="mt-4 flex justify-end border-t border-white/10 pt-4">{right}</div>
    </Panel>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function SystemsPanel() {
  return <CatalogPanelBase kind="systems" />;
}

export function WorkPanel() {
  return <CatalogPanelBase kind="services" />;
}
