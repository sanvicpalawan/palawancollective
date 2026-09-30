"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, cn } from "@/components/ui";
import { inquiryFocusOptions, inquiryTimelineOptions } from "@/lib/site";

type Kind = "project" | "partner";
type State = { status: "idle" | "sending" | "sent" | "error"; message?: string };

const PARTNER_FOCUS = "Ecosystem Partnerships";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({
  label,
  name,
  type = "text",
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="label-mono text-ink-2">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className="field text-ink"
      />
      {error && <span className="mt-1.5 block text-[13px] text-clay-deep">{error}</span>}
    </label>
  );
}

export function InquiryForm({ initialKind = "project" }: { initialKind?: Kind }) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [focus, setFocus] = useState<string>(initialKind === "partner" ? PARTNER_FOCUS : inquiryFocusOptions[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<State>({ status: "idle" });

  function switchKind(next: Kind) {
    setKind(next);
    if (next === "partner") setFocus(PARTNER_FOCUS);
    else if (focus === PARTNER_FOCUS) setFocus(inquiryFocusOptions[0]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(
      Array.from(new FormData(form).entries()).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
    ) as Record<string, string>;

    const nextErrors: Record<string, string> = {};
    if (!values.name?.trim()) nextErrors.name = "Tell us who you are.";
    if (!EMAIL_RE.test(values.email?.trim() ?? "")) nextErrors.email = "We need an email that works.";
    if ((values.message?.trim().length ?? 0) < 20) nextErrors.message = "A few more details, please — at least 20 characters.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setState({ status: "sending" });
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, kind, focus }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        throw new Error(data.error ?? "Couldn’t send that. Try again, or message us on WhatsApp.");
      }
      form.reset();
      setState({ status: "sent" });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Couldn’t send that." });
    }
  }

  if (state.status === "sent") {
    return (
      <div role="status" className="border border-ink/15 bg-paper p-8 md:p-12">
        <p className="label-mono text-clay-deep">Received · logged</p>
        <p className="mt-4 font-serif text-4xl font-light leading-tight md:text-5xl">Thanks — it’s in the queue.</p>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-2">
          We read everything ourselves. Expect a reply within three working days — sooner if the uplink cooperates.
        </p>
        <p className="mt-6 font-hand text-2xl text-ink-2">— D.</p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="label-mono mt-8 border-b border-ink/40 pb-1 hover:border-clay hover:text-clay-deep"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[var(--pc-radius,18px)] border border-ink/15 bg-paper p-6 shadow-[0_20px_45px_-25px_rgba(22,20,17,0.35)] md:p-10">
      <fieldset>
        <legend className="label-mono text-ink-2">I want to</legend>
        <div className="mt-3 grid grid-cols-2 border border-ink">
          {(["project", "partner"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={kind === option}
              onClick={() => switchKind(option)}
              className={cn(
                "label-mono rounded-full px-4 py-3 transition-all",
                kind === option ? "bg-ink text-sand shadow-md" : "text-ink-2 hover:text-ink",
              )}
            >
              {option === "project" ? "Start a project" : "Partner with us"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Field label="Name" name="name" autoComplete="name" error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="WhatsApp (optional)" name="whatsapp" placeholder="+63 …" autoComplete="tel" error={errors.whatsapp} />
        <Field label="Organisation / property (optional)" name="organization" autoComplete="organization" />
        <label className="block">
          <span className="label-mono text-ink-2">Focus</span>
          <select name="focus" value={focus} onChange={(e) => setFocus(e.target.value)} className="field text-ink">
            {inquiryFocusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-mono text-ink-2">Timeline</span>
          <select name="timeline" defaultValue={inquiryTimelineOptions[1]} className="field text-ink">
            {inquiryTimelineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-6 block">
        <span className="label-mono text-ink-2">{kind === "project" ? "What are you building?" : "What do you run, and how might we plug together?"}</span>
        <textarea
          name="message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          placeholder={
            kind === "project"
              ? "The site or the business, what’s working, what’s breaking, what you’ve already tried…"
              : "Resort, boats, vans, land, a business — where you are, what you need, what you could share…"
          }
          className="field text-ink"
        />
        {errors.message && <span className="mt-1.5 block text-[13px] text-clay-deep">{errors.message}</span>}
      </label>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="group label-mono inline-flex items-center justify-center gap-3 rounded-full bg-ink px-7 py-4 text-sand shadow-[0_14px_30px_-14px_rgba(22,20,17,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-clay-deep active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {state.status === "sending" ? "Sending…" : kind === "project" ? "Start a Project" : "Partner With Us"}
          <ArrowRight className="h-3 w-7 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p className="text-[13px] leading-snug text-muted">No sales team. We read everything ourselves and reply within three working days.</p>
      </div>
      {state.status === "error" && (
        <p role="alert" className="mt-4 text-[14px] text-clay-deep">
          {state.message}
        </p>
      )}
    </form>
  );
}
