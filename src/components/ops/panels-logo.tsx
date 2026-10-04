"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { opsFetch, opsJson, useOpsStore } from "@/lib/admin-store";
import { prepareImageForUpload } from "@/lib/image-upload";
import { Btn, Empty, F, Panel } from "./console";

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{label}</span>
        <span className="font-mono text-[13px] text-amber-200">{value}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={2}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-amber-400"
        aria-label={label}
      />
    </div>
  );
}

export function LogoPanel() {
  const [logo, setLogo] = useState("");
  const [headerW, setHeaderW] = useState(148);
  const [mobileW, setMobileW] = useState(116);
  const [footerW, setFooterW] = useState(168);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { pushToast } = useOpsStore();

  const load = useCallback(async () => {
    try {
      const d = await opsJson<{ settings: Record<string, unknown> }>("/api/admin/settings");
      const s = d.settings;
      setLogo(typeof s.site_logo === "string" ? s.site_logo : "");
      setHeaderW(num(s.site_logo_width, 148));
      setMobileW(num(s.site_logo_width_mobile, 116));
      setFooterW(num(s.site_logo_footer_width, 168));
      setDirty(false);
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  function touch(fn: () => void) {
    fn();
    setDirty(true);
  }

  async function upload(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("logo", await prepareImageForUpload(file));
      const res = await opsFetch("/api/admin/logo", { method: "POST", body: form });
      const d = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !d.ok || !d.url) throw new Error(d.error || "Upload failed.");
      setLogo(d.url);
      pushToast("ok", "Logo uploaded — live on the site now.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveSizes() {
    setSaving(true);
    try {
      await opsJson("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: { site_logo_width: headerW, site_logo_width_mobile: mobileW, site_logo_footer_width: footerW },
        }),
      });
      setDirty(false);
      pushToast("ok", "Logo sizes saved — live now.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Remove the logo? Header and footer revert to the wordmark.")) return;
    try {
      await opsFetch("/api/admin/logo", { method: "DELETE" });
      setLogo("");
      pushToast("ok", "Logo removed.");
    } catch (e) {
      pushToast("err", e instanceof Error ? e.message : "Remove failed.");
    }
  }

  if (loading) return <Empty text="Loading logo settings…" />;

  const preview = (width: number, dark: boolean, label: string) => (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{label}</p>
      <div
        className={`mt-2 flex h-20 items-center overflow-hidden border border-white/10 px-4 ${
          dark ? "bg-[#161411]" : "bg-[#f2ece3]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo || "/images/palawan-collective-wordmark.svg"}
          alt="Transparent Palawan Collective wordmark preview"
          style={{ width }}
          className="h-auto max-h-14 max-w-full object-contain"
        />
      </div>
    </div>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Site logo" sub="SVG, PNG, JPG or WebP · images are compressed for Vercel before saving">
        <div className="flex flex-col items-start gap-4">
          <div className="flex h-32 w-full items-center justify-center overflow-hidden border border-dashed border-white/20 bg-black/30 p-4">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Current site logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-mono text-[12px] text-stone-500">No logo — wordmark is showing.</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
            className="hidden"
            aria-label="Choose logo file"
            onChange={(e) => void upload(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap gap-2">
            <Btn kind="primary" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : logo ? "Replace logo" : "Upload logo"}
            </Btn>
            {logo && (
              <Btn kind="danger" onClick={() => void remove()}>
                Remove
              </Btn>
            )}
          </div>
          <p className="font-mono text-[11px] leading-relaxed text-stone-500">
            Best: SVG or PNG ≥1200px wide with a transparent background. The artwork sits directly on the site surface —
            no tile, badge, or background fill is added. The same mark replaces the giant hero wordmark.
          </p>
        </div>
      </Panel>

      <Panel
        title="Display sizes"
        sub="Width in pixels · height scales automatically"
        right={
          <Btn kind="primary" disabled={saving || !dirty} onClick={() => void saveSizes()}>
            {saving ? "Saving…" : "Save sizes"}
          </Btn>
        }
      >
        <div className="space-y-5">
          <F label="Header · desktop & tablet">
            <Slider label="Header width" value={headerW} min={80} max={260} onChange={(v) => touch(() => setHeaderW(v))} />
          </F>
          <F label="Header · mobile">
            <Slider label="Mobile width" value={mobileW} min={64} max={180} onChange={(v) => touch(() => setMobileW(v))} />
          </F>
          <F label="Footer">
            <Slider label="Footer width" value={footerW} min={96} max={320} onChange={(v) => touch(() => setFooterW(v))} />
          </F>
          {!dirty && <p className="font-mono text-[11px] text-stone-500">No unsaved changes.</p>}
        </div>
      </Panel>

      <Panel title="Live preview" sub="Same transparent artwork in the hero, header and footer">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">Hero · full wordmark</p>
            <div className="mt-2 border border-white/10 bg-[#f2ece3] p-3 sm:p-5">
              <div className="hero-logo-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo || "/images/palawan-collective-wordmark.svg"}
                  alt="Transparent hero wordmark preview"
                  className="hero-wordmark"
                />
              </div>
            </div>
          </div>
          {preview(headerW, false, `Header · ${headerW}px`)}
          {preview(mobileW, false, `Mobile · ${mobileW}px`)}
          {preview(footerW, true, `Footer · ${footerW}px`)}
        </div>
      </Panel>

      <Panel title="Where it shows" sub="One upload, everywhere">
        <ul className="space-y-2.5 text-[14px] text-stone-300">
          <li className="flex gap-3"><span className="text-amber-300">→</span> Hero masthead — replaces “PALAWAN COLLECTIVE” with the transparent artwork.</li>
          <li className="flex gap-3"><span className="text-amber-300">→</span> Header, left — same uploaded artwork; size stays responsive.</li>
          <li className="flex gap-3"><span className="text-amber-300">→</span> Mobile menu stays aligned to the mark.</li>
          <li className="flex gap-3"><span className="text-amber-300">→</span> Footer brand block, above the headline.</li>
        </ul>
      </Panel>
    </div>
  );
}
