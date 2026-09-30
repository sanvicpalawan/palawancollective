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
  | "partners";

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

const TOKEN_KEY = "__pc_ops_token";
const WINDOW_PREFIX = "pc-ops:";

/**
 * Triple-redundant token storage. Inside cross-site preview iframes with
 * strict tracking prevention, BOTH cookies and localStorage can be blocked —
 * so the token also lives in memory (same page load) and window.name
 * (survives full-page navigation in the same tab, even with all web
 * storage blocked). Memory is checked first, then localStorage, then
 * window.name.
 */
let memoryToken: string | null = null;

function readWindowToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const name = window.name || "";
    if (name.startsWith(WINDOW_PREFIX)) {
      const t = name.slice(WINDOW_PREFIX.length).trim();
      return t || null;
    }
    return null;
  } catch {
    return null;
  }
}

function writeWindowToken(token: string | null): void {
  try {
    if (typeof window === "undefined") return;
    if (token) {
      window.name = `${WINDOW_PREFIX}${token}`;
    } else if ((window.name || "").startsWith(WINDOW_PREFIX)) {
      window.name = "";
    }
  } catch {
    /* ignore */
  }
}

export function getOpsToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem(TOKEN_KEY);
      if (ls) {
        memoryToken = ls;
        return ls;
      }
    }
  } catch {
    /* blocked — fall through to window.name */
  }
  const w = readWindowToken();
  if (w) memoryToken = w;
  return w;
}

export function setOpsToken(token: string | null): void {
  memoryToken = token;
  try {
    if (typeof window !== "undefined") {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* blocked — memory + window.name still apply */
  }
  writeWindowToken(token);
}

/**
 * URL-hash transport: last-resort carrier so the token survives a full-page
 * navigation even when every storage API is blocked. Reads `#t=<token>`,
 * persists it via setOpsToken, and strips it from the address bar.
 */
export function consumeHashToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash || "";
    const match = /#(?:t|__pc_ops)=([^&]+)/.exec(hash);
    if (!match) return null;
    const token = decodeURIComponent(match[1] || "");
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (token) setOpsToken(token);
    return token || null;
  } catch {
    return null;
  }
}

/** Build an /admin URL carrying the token in the hash (survives anything). */
export function adminUrlWithToken(): string {
  const token = getOpsToken();
  return token ? `/admin#t=${encodeURIComponent(token)}` : "/admin";
}

export function isFramed(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
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
  // Adopt the server's refreshed token so Bearer sessions stay alive with
  // activity (the Set-Cookie twin may be blocked in embedded previews).
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
