"use client";

import { useCallback, useEffect, useState } from "react";
import { SocialIcon } from "@/components/SocialLinks";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { Btn, Empty, F, Inp, Panel, Sel, Tog } from "./console";

type SocialRow = { id: number; platform: string; label: string; url: string; position: number; visible: boolean };

const CATALOG = new Set(SOCIAL_PLATFORMS.map((p) => p.platform));

export function SocialPanel() {
  const [rows, setRows] = useState<SocialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPlatform, setAddPlatform] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ socials: SocialRow[] }>("/api/admin/social");
      setRows(d.socials);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: number, body: Partial<SocialRow>, msg?: string) {
    try {
      const d = await opsJson<{ social: SocialRow }>(`/api/admin/social?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setRows((prev) => prev.map((r) => (r.id === id ? d.social : r)));
      if (msg) pushToast("ok", msg);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function move(id: number, dir: -1 | 1) {
    const sorted = [...rows].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    const [row] = next.splice(i, 1);
    next.splice(j, 0, row);
    setRows(next.map((r, k) => ({ ...r, position: k })));
    try {
      await opsFetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: next.map((r) => r.id) }),
      });
    } catch {
      void load();
    }
  }

  async function addCatalog() {
    if (!addPlatform) return;
    try {
      const d = await opsJson<{ social: SocialRow }>("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: addPlatform, visible: true, position: rows.length }),
      });
      setRows((prev) => [...prev, d.social]);
      setAddPlatform("");
      pushToast("ok", `${d.social.label} added — paste its URL.`);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Add failed.");
    }
  }

  async function addCustom() {
    const key = customKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!key) {
      pushToast("err", "Give the custom link a key (e.g. threads).");
      return;
    }
    try {
      const d = await opsJson<{ social: SocialRow }>("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: key, label: key, url: customUrl.trim(), visible: true, position: rows.length }),
      });
      setRows((prev) => [...prev, d.social]);
      setCustomKey("");
      setCustomUrl("");
      pushToast("ok", `Custom link “${key}” added.`);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Add failed.");
    }
  }

  async function remove(id: number, label: string) {
    if (!window.confirm(`Remove “${label}” from the site?`)) return;
    try {
      await opsFetch(`/api/admin/social?id=${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      pushToast("ok", "Removed.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const missing = SOCIAL_PLATFORMS.filter((p) => !rows.some((r) => r.platform === p.platform));
  const sorted = [...rows].sort((a, b) => a.position - b.position);

  if (loading) return <Empty text="Loading social links…" />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <Panel
        title="Social links"
        sub="Same icons in header, mobile menu and footer · empty URL = hidden on site"
      >
        <div className="space-y-2">
          {sorted.map((r, i) => (
            <div key={r.id} className="grid items-center gap-3 border border-white/10 bg-white/[0.02] px-3 py-2.5 md:grid-cols-[auto_1fr] md:gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-stone-200">
                  <SocialIcon platform={r.platform} />
                </span>
                <div className="min-w-36">
                  <p className="text-[14px] text-stone-100">{r.label}</p>
                  <p className="font-mono text-[11px] text-stone-500">/{r.platform}</p>
                </div>
                <Tog on={r.visible} onChange={(v) => void patch(r.id, { visible: v })} label={`Toggle ${r.label}`} />
              </div>
              <div className="flex items-center gap-2">
                <Inp
                  value={r.url}
                  placeholder={SOCIAL_PLATFORMS.find((p) => p.platform === r.platform)?.placeholder ?? "https://…"}
                  aria-label={`${r.label} URL`}
                  onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, url: e.target.value } : x)))}
                  onBlur={(e) => void patch(r.id, { url: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  className="font-mono text-[13px]"
                />
                <div className="flex shrink-0 gap-1">
                  <Btn onClick={() => void move(r.id, -1)} title="Move up" disabled={i === 0}>↑</Btn>
                  <Btn onClick={() => void move(r.id, 1)} title="Move down" disabled={i === sorted.length - 1}>↓</Btn>
                  {r.url.trim() && !r.url.trim().startsWith("@") && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open link"
                      className="inline-flex items-center border border-white/15 px-3 py-2 font-mono text-[12px] text-stone-200 hover:border-white/35 hover:text-white"
                    >
                      ↗
                    </a>
                  )}
                  {!CATALOG.has(r.platform) && (
                    <Btn kind="danger" onClick={() => void remove(r.id, r.label)} title="Delete custom link">✕</Btn>
                  )}
                </div>
              </div>
              {!r.url.trim() && (
                <p className="font-mono text-[11px] text-amber-200/70 md:col-span-2">No URL yet — hidden on the live site until you add one.</p>
              )}
            </div>
          ))}
          {sorted.length === 0 && <Empty text="No social links yet." />}
        </div>
        <p className="mt-4 font-mono text-[11px] leading-relaxed text-stone-500">
          Tip: for catalog platforms (GitHub, X, Instagram…) prefer hiding over deleting — the URL stays saved.
          “@handles” also work for X, Instagram and TikTok.
        </p>
      </Panel>

      <div className="space-y-5">
        <Panel title="Add platform" sub="From the catalog">
          {missing.length === 0 ? (
            <Empty text="All catalog platforms are added." />
          ) : (
            <div className="space-y-3">
              <F label="Platform">
                <Sel value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}>
                  <option value="">— pick one —</option>
                  {missing.map((p) => (
                    <option key={p.platform} value={p.platform}>{p.label} · {p.hint}</option>
                  ))}
                </Sel>
              </F>
              <Btn kind="primary" onClick={() => void addCatalog()} disabled={!addPlatform}>+ Add</Btn>
            </div>
          )}
        </Panel>

        <Panel title="Custom link" sub="Anything else — press, podcast, booking">
          <div className="space-y-3">
            <F label="Key" hint="Lowercase, used for the icon fallback.">
              <Inp value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="threads" />
            </F>
            <F label="URL">
              <Inp value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://…" className="font-mono text-[13px]" />
            </F>
            <Btn kind="primary" onClick={() => void addCustom()}>+ Add custom</Btn>
          </div>
        </Panel>

        <Panel title="Live preview" sub="Exactly what visitors see">
          <div className="flex flex-wrap gap-2 border border-white/10 bg-black/30 p-4">
            {sorted.filter((r) => r.visible && r.url.trim()).map((r) => (
              <span key={r.id} title={r.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-stone-200">
                <SocialIcon platform={r.platform} />
              </span>
            ))}
            {sorted.filter((r) => r.visible && r.url.trim()).length === 0 && (
              <span className="font-mono text-[12px] text-stone-500">Nothing visible — add URLs above.</span>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
