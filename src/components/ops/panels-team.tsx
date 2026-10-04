"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { prepareImageForUpload } from "@/lib/image-upload";
import { Btn, Empty, F, Inp, Panel, Tog, Txt } from "./console";

type TeamRow = {
  id: number;
  name: string;
  role: string;
  location: string;
  photo: string;
  photoAlt: string;
  bio: string;
  url: string;
  position: number;
  visible: boolean;
};

type Editable = Pick<TeamRow, "name" | "role" | "location" | "photo" | "photoAlt" | "bio" | "url">;

function MemberPhoto({ src, name, className }: { src: string; name: string; className: string }) {
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const failed = failedFor === src;
  const initials = name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={`relative overflow-hidden bg-[#f2ece3] ${className}`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setFailedFor(src)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-serif text-2xl text-stone-500/70">
          {initials || "?"}
        </span>
      )}
    </div>
  );
}

/**
 * Dream team panel — the roster behind the home page block that sits under the
 * hero. Add, edit, reorder, hide and delete members; every save snapshots, so
 * Version history can undo it.
 */
export function DreamTeamPanel() {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [draft, setDraft] = useState<TeamRow | null>(null);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ team: TeamRow[] }>("/api/admin/team");
      setRows(d.team);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(id: number, fields: Partial<Editable>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));
  }

  async function put(id: number, fields: Record<string, string>, file?: File): Promise<boolean> {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    if (file) form.append("photoFile", file);
    try {
      const res = await opsFetch(`/api/admin/team?id=${id}`, { method: "PUT", body: form });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; member?: TeamRow; error?: string };
      if (!res.ok || !d.ok || !d.member) throw new Error(d.error || `Save failed (${res.status}).`);
      setRows((prev) => prev.map((r) => (r.id === id ? d.member! : r)));
      return true;
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
      return false;
    }
  }

  // ---- per-row photo upload ------------------------------------------------
  const photoTarget = useRef<number | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  function pickPhoto(id: number) {
    photoTarget.current = id;
    photoInput.current?.click();
  }

  async function onPhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = photoTarget.current;
    e.target.value = "";
    if (!file || id === null) return;
    setUploadingPhoto(id);
    try {
      const prepared = await prepareImageForUpload(file);
      const saved = await put(id, {}, prepared);
      if (saved) pushToast("ok", "Photo saved to the database; it will survive a redeploy.");
    } catch (error) {
      pushToast("err", error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setUploadingPhoto(null);
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
    put(next[j].id, { position: String(i) });
    put(next[i].id, { position: String(j) });
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`Remove “${name}” from the Dream Team?`)) return;
    try {
      await opsFetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      pushToast("ok", "Member removed.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Delete failed.");
    }
  }

  // ---- add form ------------------------------------------------------------
  const addFileInput = useRef<HTMLInputElement>(null);
  const [addFile, setAddFile] = useState<File | null>(null);
  const empty = (): TeamRow => ({
    id: 0,
    name: "",
    role: "",
    location: "Palawan Island",
    photo: "",
    photoAlt: "",
    bio: "",
    url: "",
    position: rows.length,
    visible: true,
  });

  async function add() {
    if (!draft) return setDraft(empty());
    if (!draft.name.trim()) return pushToast("err", "Name the member first.");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("name", draft.name.trim());
      form.append("role", draft.role.trim());
      form.append("location", draft.location.trim());
      form.append("bio", draft.bio.trim());
      form.append("photo", draft.photo.trim());
      form.append("photoAlt", draft.photoAlt.trim());
      form.append("url", draft.url.trim());
      form.append("position", String(rows.length));
      form.append("visible", "true");
      if (addFile) form.append("photoFile", await prepareImageForUpload(addFile));
      const res = await opsFetch("/api/admin/team", { method: "POST", body: form });
      const d = (await res.json()) as { ok?: boolean; member?: TeamRow; error?: string };
      if (!res.ok || !d.ok || !d.member) throw new Error(d.error || "Add failed.");
      setRows((prev) => [...prev, d.member!]);
      setDraft(null);
      setAddFile(null);
      pushToast("ok", "Added to the Dream Team — live on the home page.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Add failed.");
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...rows].sort((a, b) => a.position - b.position);

  if (loading) return <Empty text="Loading the Dream Team…" />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <Panel
        title="Dream Team"
        sub="Home page, straight after the hero · order left → right, top → bottom"
        right={
          draft ? (
            <Btn onClick={() => { setDraft(null); setAddFile(null); }}>Cancel</Btn>
          ) : (
            <Btn kind="primary" onClick={() => setDraft(empty())}>
              + Add member
            </Btn>
          )
        }
      >
        {draft && (
          <div className="mb-4 space-y-3 border border-amber-300/30 bg-amber-400/5 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="Name">
                <Inp
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Tonton Varquez"
                />
              </F>
              <F label="Role / title">
                <Inp
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  placeholder="e.g. Marine Logistics & Expedition Lead"
                />
              </F>
              <F label="Location">
                <Inp
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  placeholder="e.g. Port Barton & San Vicente"
                />
              </F>
              <F label="Website (optional)">
                <Inp
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://…"
                  className="font-mono text-[13px]"
                />
              </F>
            </div>
            <F label="Short description">
              <Txt
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                placeholder="Two or three sentences. A blank line starts a new paragraph in the profile popup."
              />
            </F>
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="Photo path or URL" hint="Leave blank to use the uploaded file below.">
                <Inp
                  value={draft.photo}
                  onChange={(e) => setDraft({ ...draft, photo: e.target.value })}
                  placeholder="/images/team/1000057299_2.jpg"
                  className="font-mono text-[13px]"
                />
              </F>
              <F label="Photo alt text" hint="Screen readers. Blank falls back to “Portrait of {name}”.">
                <Inp
                  value={draft.photoAlt}
                  onChange={(e) => setDraft({ ...draft, photoAlt: e.target.value })}
                  placeholder="Tonton Varquez on the beach at San Vicente"
                />
              </F>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={addFileInput}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.avif,image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                aria-label="Member photo file"
                onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
              />
              <Btn onClick={() => addFileInput.current?.click()}>{addFile ? `File: ${addFile.name}` : "Choose photo…"}</Btn>
              {addFile && (
                <Btn kind="danger" onClick={() => setAddFile(null)}>
                  Clear file
                </Btn>
              )}
              <span className="font-mono text-[11px] text-stone-500">PNG · JPG · WebP · AVIF · compressed for Vercel · portrait 4:5 crops best</span>
              <Btn kind="primary" disabled={busy} onClick={() => void add()}>
                {busy ? "Adding…" : "+ Add member"}
              </Btn>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sorted.map((r, i) => (
            <div key={r.id} className="border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-start gap-3">
                <MemberPhoto src={r.photo} name={r.name} className="h-24 w-[4.8rem] shrink-0 rounded-lg" />

                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <Inp
                    value={r.name}
                    name="name"
                    aria-label="Member name"
                    onChange={(e) => patch(r.id, { name: e.target.value })}
                    onBlur={(e) => put(r.id, { name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="!text-[14px]"
                  />
                  <Inp
                    value={r.role}
                    name="role"
                    aria-label="Member role"
                    placeholder="Role / title"
                    onChange={(e) => patch(r.id, { role: e.target.value })}
                    onBlur={(e) => put(r.id, { role: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="!text-[13px]"
                  />
                  <Inp
                    value={r.location}
                    name="location"
                    aria-label="Member location"
                    placeholder="Location"
                    onChange={(e) => patch(r.id, { location: e.target.value })}
                    onBlur={(e) => put(r.id, { location: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="!text-[13px] font-mono"
                  />
                  <Inp
                    value={r.photo}
                    name="photo"
                    aria-label="Member photo path"
                    placeholder="/images/team/….jpg or /uploads/….jpg"
                    onChange={(e) => patch(r.id, { photo: e.target.value })}
                    onBlur={(e) => put(r.id, { photo: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="!text-[12px] font-mono"
                  />
                  <div className="sm:col-span-2">
                    <Txt
                      value={r.bio}
                      name="bio"
                      aria-label="Member description"
                      rows={2}
                      className="!min-h-16"
                      placeholder="Short description shown on the card (first 3 lines) and in full in the popup."
                      onChange={(e) => patch(r.id, { bio: e.target.value })}
                      onBlur={(e) => put(r.id, { bio: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Tog on={r.visible} onChange={(v) => put(r.id, { visible: v ? "true" : "false" })} label={`Toggle ${r.name}`} />
                  <div className="flex gap-1">
                    <Btn onClick={() => pickPhoto(r.id)} title="Upload a new photo" disabled={uploadingPhoto !== null}>
                      {uploadingPhoto === r.id ? "…" : "⇧"}
                    </Btn>
                    <Btn onClick={() => move(r.id, -1)} title="Move up" disabled={i === 0}>
                      ↑
                    </Btn>
                    <Btn onClick={() => move(r.id, 1)} title="Move down" disabled={i === sorted.length - 1}>
                      ↓
                    </Btn>
                    <Btn kind="danger" onClick={() => void remove(r.id, r.name)} title="Delete member">
                      ✕
                    </Btn>
                  </div>
                </div>
              </div>

              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-[6.4rem] mt-2 inline-block truncate font-mono text-[11px] text-stone-400 hover:text-amber-200"
                  title={r.url}
                >
                  {r.url}
                </a>
              )}
            </div>
          ))}
          {sorted.length === 0 && <Empty text="No members yet — add the first one with “+ Add member”." />}
        </div>

        <input ref={photoInput} type="file" accept=".png,.jpg,.jpeg,.webp,.avif" className="hidden" onChange={onPhotoChosen} aria-label="Replace member photo" />

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-stone-500">
          Photos in <span className="text-stone-300">/images/team/</span> ship with the repo; uploaded photos are stored in
          Postgres and served from <span className="text-stone-300">/uploads/</span>. A card with a missing photo shows the
          member’s initials instead of a broken image. The whole block can be hidden or moved with Content Builder →
          “Dream Team”.
        </p>
      </Panel>

      <div className="space-y-5">
        <Panel title="Live wall" sub="Exactly what the home page shows">
          <div className="grid grid-cols-2 gap-3">
            {sorted
              .filter((r) => r.visible)
              .map((r) => (
                <div key={r.id} className="overflow-hidden rounded-[var(--pc-radius,18px)] border border-ink/10 bg-[#f8f4ed]">
                  <MemberPhoto src={r.photo} name={r.name} className="aspect-[4/5] bg-[#e8dfd0]" />
                  <div className="p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#a14a29]">{r.role || "—"}</p>
                    <p className="mt-1 truncate font-serif text-[15px] text-[#161411]">{r.name}</p>
                  </div>
                </div>
              ))}
            {sorted.filter((r) => r.visible).length === 0 && (
              <span className="col-span-2 font-mono text-[12px] text-stone-500">Nothing visible right now.</span>
            )}
          </div>
        </Panel>

        <Panel title="Copy for this block" sub="Edited in Content Builder → Dream Team">
          <ul className="space-y-1.5 font-mono text-[11px] leading-relaxed text-stone-400">
            <li>index · the “§ 01” label above the heading</li>
            <li>first / second · the two heading lines</li>
            <li>description · the paragraph on the right</li>
            <li>href / linkLabel · the link under it</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
