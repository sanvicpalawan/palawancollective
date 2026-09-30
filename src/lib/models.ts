import type { CachedModel } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Model providers: OpenRouter (cloud) + Ollama (local)                  */
/* ------------------------------------------------------------------ */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function fetchOpenRouterModels(apiKey?: string): Promise<CachedModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`OpenRouter models: HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: Array<{ id: string; name?: string; context_length?: number; pricing?: { prompt?: string | number } }>;
  };
  const list = Array.isArray(json.data) ? json.data : [];
  return list
    .map((m) => {
      const promptPrice = Number(m.pricing?.prompt ?? NaN);
      const free = m.id.endsWith(":free") || promptPrice === 0;
      return { id: m.id, name: m.name || m.id, free, context: m.context_length };
    })
    .sort((a, b) => Number(b.free) - Number(a.free) || a.id.localeCompare(b.id));
}

export async function fetchOllamaModels(baseUrl: string): Promise<CachedModel[]> {
  const base = baseUrl.replace(/\/$/, "");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${base}/api/tags`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Ollama: HTTP ${res.status}`);
    const json = (await res.json()) as { models?: Array<{ name?: string; model?: string }> };
    const list = Array.isArray(json.models) ? json.models : [];
    return list.map((m) => ({
      id: m.name || m.model || "unknown",
      name: m.name || m.model || "unknown",
      free: true,
      provider: "ollama",
    }));
  } finally {
    clearTimeout(timer);
  }
}

export async function chatOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: { temperature: number; maxTokens: number },
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://palawancollective.com",
      "X-Title": "Palawan Collective",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter chat failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenRouter returned an empty reply.");
  return content;
}

export async function chatOllama(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
  opts: { temperature: number; maxTokens: number },
): Promise<string> {
  const base = baseUrl.replace(/\/$/, "");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: opts.temperature, num_predict: opts.maxTokens },
      }),
    });
    if (!res.ok) throw new Error(`Ollama chat failed (${res.status})`);
    const json = (await res.json()) as { message?: { content?: string } };
    const content = json.message?.content?.trim();
    if (!content) throw new Error("Ollama returned an empty reply.");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Offline fallback: keyword retrieval over site knowledge               */
/* ------------------------------------------------------------------ */

export type KnowledgeEntry = { keys: string[]; text: string };

export const SITE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    keys: ["stay", "book", "room", "resort stay", "visit site", "guest"],
    text: "Site 01 isn't open to guests yet — we're finishing the build and proving the water and power systems through a full season. The dispatch announces openings first; subscribe at the bottom of the page.",
  },
  {
    keys: ["fly", "flight", "airport", "getting there", "manila", "puerto princesa", "el nido", "coron"],
    text: "Most people fly into Puerto Princesa (PPS) — cheapest, most flights — then ride 5–6 hours north to El Nido. Lio airport (ENI) costs more but saves most of a day. For Coron, fly into Busuanga (USU). The full breakdown is in Navigating Palawan → Getting There.",
  },
  {
    keys: ["van", "tricycle", "scooter", "moving around", "transport", "boat transfer"],
    text: "Shared vans connect the main towns (cheap, leave when full). Private vans are worth it for groups — book the day before. Around El Nido and Port Barton, scooters work if you're an experienced rider. Boats depend on weather; never plan an onward flight the same day as a crossing.",
  },
  {
    keys: ["internet", "wifi", "power", "electricity", "water", "off-grid", "solar", "signal"],
    text: "Outside the main towns, expect power interruptions and patchy mobile data — most serious setups run solar + batteries and satellite internet with a 4G failover. If you work remotely, ask what backs up the Wi-Fi router, not just whether Wi-Fi exists.",
  },
  {
    keys: ["agent", "ai", "automation", "whatsapp", "booking system"],
    text: "We build WhatsApp-first booking and messaging systems for local businesses, plus AI agents that answer, draft and escalate — offline-first, with a human approving anything involving money or bookings. See Work With Us → Business Automation Systems.",
  },
  {
    keys: ["work", "project", "partner", "hire", "cost", "price", "service"],
    text: "We take on a few projects a year: resort & land development, business automation, AI agent deployment, and ecosystem partnerships. Start from Work With Us — the more specific you are about site, business and numbers, the more useful our reply.",
  },
  {
    keys: ["who", "david", "about", "collective", "ecosystem"],
    text: "Palawan Collective is David Le Smith's living system: off-grid resorts, automation for local businesses, and shared logistics across northern Palawan — documented weekly as field notes. Not a portfolio, not a blog.",
  },
  {
    keys: ["weather", "season", "habagat", "amihan", "rain", "best time", "when"],
    text: "Dry season runs roughly November–May — that's when boats and builds behave. Habagat (June–October) brings wind, swell and cancellations. Add buffer days to anything depending on a boat.",
  },
  {
    keys: ["contact", "whatsapp", "email", "talk", "human"],
    text: "Fastest way to reach a human is WhatsApp — scan the code in the footer or use the link on the Work With Us page. We read everything ourselves and reply within three working days.",
  },
  {
    keys: ["newsletter", "subscribe", "dispatch", "field notes"],
    text: "Field Notes goes out Sunday morning, Manila time: what's working, what's breaking, what we're building next. Drop your email in the subscribe box — one click to unsubscribe.",
  },
];

export function fallbackAnswer(question: string): string {
  const q = question.toLowerCase();
  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const entry of SITE_KNOWLEDGE) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) score += key.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best && bestScore >= 3) return best.text;
  return "Good question — and one I don't have a solid on-the-ground answer for yet. Try the Stories or Navigating Palawan sections, or message us on WhatsApp and a human will reply within three working days.";
}
