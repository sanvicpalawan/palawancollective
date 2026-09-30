"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { Btn, Empty, F, Inp, Panel, Tog } from "./console";

type PartnerRow = {
  id: number;
  name: string;
  logo: string;
  url: string;
  position: number;
  visible: boolean;
};

export function PartnersPanel() {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const addFileRef = useRef<HTMLInputElement>(null);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ partners: PartnerRow[] }>("/api/admin/partners");
      setRows(d.partners);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  function put(id: number, fields: Record<string, string>, file?: File) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    if (file) form.append("logo", file);
    opsFetch(`/api/admin/partners?id=${id}`, { method: "PUT", body: form })
      .then((res) => res.json())
      .then((d) => {
        if (d.ok) setRows((prev) => prev.map((r) => (r.id === id ? d.partner : r)));
        else pushToast("err", d.error || "Save failed.");
      })
      .catch((e: Error) => pushToast("err", e.message));
  }

  function patch(id: number, patch: Partial<Pick<PartnerRow, "name" | "url">>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function add() {
    if (!addName.trim()) return pushToast("err", "Name the partner first.");
    if (!addFile) return pushToast("err", "Choose a logo file (SVG or PNG with transparency).");
    setAdding(true);
    try {
      const form = new FormData();
      form.append("name", addName.trim());
      form.append("url", addUrl.trim());
      form.append("logo", addFile);
      const res = await opsFetch("/api/admin/partners", { method: "POST", body: form });
      const d = (await res.json()) as { ok?: boolean; partner?: PartnerRow; error?: string };
      if (!res.ok || !d.ok || !d.partner) throw new Error(d.error || "Add failed.");
      setRows((prev) => [...prev, d.partner!]);
      setAddName("");
      setAddUrl("");
      setAddFile(null);
      if (addFileRef.current) addFileRef.current.value = "";
      pushToast("ok", "Partner added — live on the home page.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Add failed.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`Remove “${name}” from the partners wall?`)) return;
    try {
      await opsFetch(`/api/admin/partners?id=${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      pushToast("ok", "Partner removed.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Delete failed.");
    }
  }

  function move(id: number, dir: -1 | 1) {
    const sorted = [...rows].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    const [row] = next.splice(i, 1);
    next.splice(j, 0, row);
    setRows(next.map((r, k) => ({ ...r, position: k })));
    // Persist both moved positions.
    put(next[i].id, { position: String(j) });
    put(next[j].id, { position: String(i) });
  }

  const sorted = [...rows].sort((a, b) => a.position - b.position);

  if (loading) return <Empty text="Loading partners…" />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <Panel title="Partners" sub="Shown in the “Our Partners” section · order left → right">
        <div className="space-y-2">
          {sorted.map((r, i) => (
            <div key={r.id} className="border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f8f4ed] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.logo} alt={r.name} className="h-full w-full object-contain" />
                </div>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <Inp
                    value={r.name}
                    aria-label="Partner name"
                    onChange={(e) => patch(r.id, { name: e.target.value })}
                    onBlur={(e) => put(r.id, { name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="!text-[14px]"
                  />
                  <Inp
                    value={r.url}
                    aria-label="Partner website"
                    placeholder="Website (optional) — https://…"
                    onChange={(e) => patch(r.id, { url: e.target.value })}
                    onBlur={(e) => put(r.id, { url: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="!text-[13px] font-mono"
                  />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Tog on={r.visible} onChange={(v) => put(r.id, { visible: v ? "true" : "false" })} label={`Toggle ${r.name}`} />
                  <div className="flex gap-1">
                    <Btn onClick={() => move(r.id, -1)} title="Move up" disabled={i === 0}>↑</Btn>
                    <Btn onClick={() => move(r.id, 1)} title="Move down" disabled={i === sorted.length - 1}>↓</Btn>
                    <Btn kind="danger" onClick={() => void remove(r.id, r.name)} title="Delete partner">✕</Btn>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <Empty text="No partners yet — add the first one on the right." />}
        </div>
        <p className="mt-4 font-mono text-[11px] leading-relaxed text-stone-500">
          Logos sit on the site’s beige card in their own colors — upload transparent SVG or PNG for the cleanest
          result. A blank website field shows the logo without a link.
        </p>
      </Panel>

      <div className="space-y-5">
        <Panel title="Add partner" sub="Logo + name, optional website">
          <div className="space-y-3">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/30 p-3">
              {addFile ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={URL.createObjectURL(addFile)} alt="Logo preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="font-mono text-[12px] text-stone-500">Logo preview</span>
              )}
            </div>
            <input
              ref={addFileRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
              className="hidden"
              aria-label="Partner logo file"
              onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex gap-2">
              <Btn onClick={() => addFileRef.current?.click()}>
                {addFile ? "Change logo" : "Choose logo"}
              </Btn>
              {addFile && (
                <Btn kind="danger" onClick={() => { setAddFile(null); if (addFileRef.current) addFileRef.current.value = ""; }}>
                  Clear
                </Btn>
              )}
            </div>
            <F label="Name">
              <Inp value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Kapwa Hospitality Group" />
            </F>
            <F label="Website (optional)">
              <Inp value={addUrl} onChange={(e) => setAddUrl(e.target.value)} placeholder="https://…" className="font-mono text-[13px]" />
            </F>
            <Btn kind="primary" disabled={adding} onClick={() => void add()}>
              {adding ? "Adding…" : "+ Add partner"}
            </Btn>
          </div>
        </Panel>

        <Panel title="Live wall" sub="Exactly what the home page shows">
          <div className="grid grid-cols-2 gap-3">
            {sorted.filter((r) => r.visible).map((r) => (
              <div
                key={r.id}
                className="flex aspect-[16/10] items-center justify-center rounded-[var(--pc-radius,18px)] border border-ink/10 bg-[#f8f4ed] p-4"
                title={r.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.logo} alt={r.name} className="h-full w-full object-contain" />
              </div>
            ))}
            {sorted.filter((r) => r.visible).length === 0 && (
              <span className="col-span-2 font-mono text-[12px] text-stone-500">Nothing visible right now.</span>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
