"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { prepareImageForUpload } from "@/lib/image-upload";
import { Btn, Empty, F, Inp, Panel, timeShort } from "./console";

/* ------------------------------------------------------------------ */

type Slot = { key: string; group: string; title: string; where: string; url: string };
type MediaRow = { id: number; filename: string; url: string; mime: string; size: number; createdAt: string };

function fmtSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Site images — every photo the live site renders, grouped by where it appears.
 * Swap a picture by uploading over it, or by picking one already in the library.
 */
export function ImagesPanel() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const [i, m] = await Promise.all([
        opsJson<{ slots: Slot[] }>("/api/admin/images"),
        opsJson<{ media: MediaRow[] }>("/api/admin/media"),
      ]);
      setSlots(i.slots);
      setMedia(m.media);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    }
  }, [pushToast]);

  useEffect(() => {
    // Fetch inline: calling the `load` callback from an effect trips the
    // react-hooks set-state-in-effect rule even though it awaits first.
    opsJson<{ slots: Slot[] }>("/api/admin/images")
      .then((d) => setSlots(d.slots))
      .catch((e) => pushToast("err", e instanceof Error ? e.message : "Load failed."));
    opsJson<{ media: MediaRow[] }>("/api/admin/media")
      .then((d) => setMedia(d.media))
      .catch(() => undefined);
  }, [pushToast]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? slots.filter((s) => `${s.title} ${s.where} ${s.group} ${s.url}`.toLowerCase().includes(q))
      : slots;
    const map = new Map<string, Slot[]>();
    for (const s of filtered) {
      const list = map.get(s.group) ?? [];
      list.push(s);
      map.set(s.group, list);
    }
    return [...map.entries()];
  }, [slots, query]);

  async function replace(key: string, url: string, label: string) {
    if (!url) return;
    setBusy(key);
    try {
      await opsJson("/api/admin/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, url }),
      });
      setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, url } : s)));
      setOpen(null);
      pushToast("ok", `Updated — ${label}`);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Swap failed.");
    } finally {
      setBusy(null);
    }
  }

  async function upload(key: string, label: string, file: File | null | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const form = new FormData();
      form.append("files", prepared);
      const res = await opsFetch("/api/admin/media", { method: "POST", body: form });
      const d = (await res.json()) as { ok?: boolean; saved?: Array<{ url: string }>; error?: string };
      if (!res.ok || !d.ok || !d.saved?.[0]) throw new Error(d.error || "Upload failed.");
      await replace(key, d.saved[0].url, label);
      const m = await opsJson<{ media: MediaRow[] }>("/api/admin/media");
      setMedia(m.media);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Site images"
        sub="Every photo on the live site, grouped by where it appears. Click one to swap it."
        right={<Btn onClick={() => void load()}>Refresh</Btn>}
      >
        <Inp
          placeholder="Search by title, page or filename…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-4"
        />

        {groups.length === 0 && <Empty text={query ? "Nothing matches that search." : "No images found."} />}

        <div className="space-y-6">
          {groups.map(([group, list]) => (
            <section key={group}>
              <p className="mb-2.5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-300/80">
                {group}
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-stone-500">{list.length}</span>
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {list.map((s) => (
                  <div key={s.key} className="border border-white/10 bg-black/20">
                    <button
                      type="button"
                      onClick={() => setOpen(open === s.key ? null : s.key)}
                      className="group block w-full text-left"
                      aria-expanded={open === s.key}
                    >
                      <span className="relative block aspect-[4/3] overflow-hidden bg-stone-800">
                        {s.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center font-mono text-[11px] text-stone-500">
                            no image
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-2 pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-200 opacity-0 transition-opacity group-hover:opacity-100">
                          {busy === s.key ? "Saving…" : "Swap →"}
                        </span>
                      </span>
                    </button>

                    <div className="p-2.5">
                      <p className="truncate text-[13px] text-stone-100" title={s.title}>
                        {s.title}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500" title={s.where}>
                        {s.where}
                      </p>

                      {open === s.key && (
                        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                          <F label="Paste a URL">
                            <Inp
                              defaultValue={s.url}
                              placeholder="/uploads/… or https://…"
                              aria-label={`Image URL for ${s.title}`}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  void replace(s.key, (e.target as HTMLInputElement).value, s.title);
                                }
                              }}
                            />
                          </F>
                          <div>
                            <label className="flex cursor-pointer items-center justify-center border border-dashed border-white/25 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-stone-300 hover:border-amber-300/60 hover:text-white">
                              {uploading ? "Uploading…" : "Upload over it"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => {
                                  void upload(s.key, s.title, e.target.files?.[0]);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>

                          {media.length > 0 && (
                            <div>
                              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
                                Or pick from library
                              </p>
                              <div className="flex max-h-28 gap-1.5 overflow-y-auto overflow-x-auto pb-1">
                                {media
                                  .filter((m) => m.mime.startsWith("image"))
                                  .slice(0, 40)
                                  .map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      title={`${m.filename} · ${fmtSize(m.size)} · ${timeShort(m.createdAt)}`}
                                      onClick={() => void replace(s.key, m.url, s.title)}
                                      className="h-14 w-20 shrink-0 overflow-hidden border border-white/10 hover:border-amber-300/60"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Btn onClick={() => setOpen(null)}>Close</Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Panel>
    </div>
  );
}
