"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, cn } from "@/components/ui";

type Props = {
  source: string;
  tone?: "light" | "dark";
  compact?: boolean;
  buttonLabel?: string;
};

type State = { status: "idle" | "loading" | "done" | "error"; message?: string };

export function SubscribeForm({ source, tone = "light", compact = false, buttonLabel = "Subscribe to the Dispatch" }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const dark = tone === "dark";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const honeypot = (event.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong. Try again in a minute.");
      setState({ status: "done", message: data.message ?? "You’re on the list." });
      setEmail("");
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  if (state.status === "done") {
    return (
      <div
        role="status"
        className={cn("flex items-start gap-3 border-l-2 py-2 pl-4", dark ? "border-clay-light" : "border-clay")}
      >
        <p className={cn("font-hand text-2xl leading-tight", dark ? "text-sand" : "text-ink")}>{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <div className={cn("flex gap-3", compact ? "flex-col" : "flex-col sm:flex-row sm:items-end")}>
        <label className="block flex-1">
          <span className={cn("label-mono", dark ? "text-sand/55" : "text-ink-2")}>Email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere.com"
            aria-invalid={state.status === "error"}
            className={cn("field", dark ? "text-sand" : "text-ink")}
          />
        </label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className={cn(
            "group label-mono inline-flex shrink-0 items-center justify-center gap-3 rounded-full px-6 py-3.5 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0",
            dark ? "bg-clay text-sand hover:bg-clay-light hover:text-ink" : "bg-ink text-sand hover:bg-clay-deep",
          )}
        >
          {state.status === "loading" ? "Sending…" : buttonLabel}
          <ArrowRight className="h-3 w-7 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className={cn("mt-3 text-[13px]", dark ? "text-clay-light" : "text-clay-deep")}>
          {state.message}
        </p>
      )}
    </form>
  );
}
