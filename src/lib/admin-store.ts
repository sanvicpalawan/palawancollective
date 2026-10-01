"use client";

import { create } from "zustand";

/**
 * Ops console state (Zustand).
 * - session: stealth auth status
 * - view: active sidebar section
 * - designDraft: live design preview before applying
 * - dirty flags + toasts for power-user feedback
 */

export type OpsView =
  | "overview"
  | "content"
  | "design"
  | "media"
  | "images"
  | "stories"
  | "built"
  | "palawan"
  | "systems"
  | "work"
  | "navigation"
  | "newsletter"
  | "faq"
  | "gallery"
  | "agents"
  | "models"
  | "settings"
  | "social"
  | "logo"
  | "partners"
  | "team";

export type Toast = { id: number; kind: "ok" | "err" | "info"; text: string };

type Session = { authed: boolean; checked: boolean };

type OpsState = {
  session: Session;
  view: OpsView;
  toasts: Toast[];
  designDirty: boolean;
  setSession: (s: Session) => void;
  setView: (v: OpsView) => void;
  pushToast: (kind: Toast["kind"], text: string) => void;
  dismissToast: (id: number) => void;
  setDesignDirty: (d: boolean) => void;
};

let toastId = 1;

export const useOpsStore = create<OpsState>((set) => ({
  session: { authed: false, checked: false },
  view: "overview",
  toasts: [],
  designDirty: false,
  setSession: (session) => set({ session }),
  setView: (view) => set({ view }),
  pushToast: (kind, text) => {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, kind, text }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setDesignDirty: (designDirty) => set({ designDirty }),
}));

/**
 * Session token: held in memory only, for the current page life.
 *
 * The durable carrier is the httpOnly session cookie — it survives full-page
 * navigation on its own, so there is no reason to duplicate the token into
 * localStorage, window.name or the URL (all JS-readable or history-persisted
 * and therefore XSS/leak surfaces).
 */
let memoryToken: string | null = null;

export function getOpsToken(): string | null {
  return memoryToken;
}

export function setOpsToken(token: string | null): void {
  memoryToken = token;
}

/** Merge the Bearer token (if any) into fetch headers. */
export function opsAuthHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {};
  if (extra) {
    if (extra instanceof Headers) extra.forEach((v, k) => (headers[k] = v));
    else if (Array.isArray(extra)) for (const [k, v] of extra) headers[k] = v;
    else Object.assign(headers, extra);
  }
  const token = getOpsToken();
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** Authenticated fetch helper — throws { status } on failure. */
export async function opsFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: opsAuthHeaders(init?.headers),
  });
  // Adopt the server's refreshed token so the in-memory session stays alive.
  const refreshed = res.headers.get("X-Ops-Token");
  if (refreshed && res.ok) setOpsToken(refreshed.trim());
  if (res.status === 401) {
    setOpsToken(null);
    useOpsStore.getState().setSession({ authed: false, checked: true });
    throw new Error("Session expired. Sign back in to continue.");
  }
  return res;
}

export async function opsJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await opsFetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}
