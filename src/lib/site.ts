/**
 * Site-wide configuration. Safe to import from client components
 * (only NEXT_PUBLIC_* variables are read here).
 *
 * Set these in .env to go live:
 *   NEXT_PUBLIC_WHATSAPP_NUMBER=63XXXXXXXXXX
 *   NEXT_PUBLIC_CONTACT_EMAIL=you@yourdomain.com
 *   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
 */
export const site = {
  name: "Palawan Collective",
  person: "David Le Smith",
  role: "Builder of places, systems, and autonomous operations.",
  tagline:
    "Stories, systems, and infrastructure from building off-grid resorts and automation ecosystems in Palawan.",
  positioning:
    "Building off-grid resorts, automation systems, and real-world infrastructure in Palawan — and documenting the process.",
  intro:
    "I document the process of building sustainable resorts, deploying automation for local businesses, and creating an ecosystem where technology and nature operate together.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@palawancollective.com",
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "639000000000").replace(/\D/g, ""),
  location: "Palawan, Philippines",
  coordinates: "11.2° N · 119.4° E",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://palawancollective.com").replace(/\/$/, ""),
};

export function whatsappDisplay(): string {
  const n = site.whatsappNumber;
  if (n.startsWith("63") && n.length === 12) return `+63 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
  return `+${n}`;
}

export function whatsappLink(text?: string): string {
  return `https://wa.me/${site.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const navItems = [
  { href: "/stories", label: "Stories" },
  { href: "/built", label: "Built" },
  { href: "/#systems", label: "Systems" },
  { href: "/palawan", label: "Palawan" },
  { href: "/work-with-us", label: "Work with us" },
] as const;

export type SystemIcon = "sun" | "chat" | "agent" | "approve" | "layers";

export const systems: {
  code: string;
  icon: SystemIcon;
  title: string;
  detail: string;
  parts: string[];
}[] = [
  {
    code: "S/01",
    icon: "sun",
    title: "Off-grid infrastructure",
    detail: "Solar, storage, water and logistics for sites the grid and the road never reached.",
    parts: ["Solar + LiFePO₄", "Rainwater + wells", "Bangka logistics", "Surge + spares"],
  },
  {
    code: "S/02",
    icon: "chat",
    title: "Automation systems for local businesses",
    detail:
      "WhatsApp-first flows that run on one shared phone and prepaid data — in the languages customers actually use.",
    parts: ["WhatsApp flows", "Shared sheets", "GCash links", "Tagalog / English"],
  },
  {
    code: "S/03",
    icon: "agent",
    title: "AI agents for operations + communication",
    detail: "Agents that answer, draft, schedule and escalate — built to queue and retry when the uplink drops.",
    parts: ["Offline queue", "Failover uplinks", "Escalation", "Audit logs"],
  },
  {
    code: "S/04",
    icon: "approve",
    title: "Booking + payment systems",
    detail: "Human + agent approval. The agent drafts the booking and the payment link; a person taps approve.",
    parts: ["Human-in-the-loop", "Deposits", "Boat manifests", "Reminders"],
  },
  {
    code: "S/05",
    icon: "layers",
    title: "Digital layers on physical environments",
    detail: "Batteries, tanks, pumps, boats and guests reporting into one place — and paging the right human.",
    parts: ["Sensors", "Thresholds", "Caretaker alerts", "Run books"],
  },
];

export const services: {
  id: string;
  number: string;
  title: string;
  qualifier?: string;
  summary: string;
  format: string;
  includes: string[];
}[] = [
  {
    id: "resort",
    number: "01",
    title: "Resort & Land Development",
    qualifier: "Palawan",
    summary: "Site selection, due diligence, off-grid design and build management — from the first boat ride to the first guest.",
    format: "On-ground · 6–24 months",
    includes: ["Site, access & tide assessment", "Power, water & logistics design", "Local crew & build management"],
  },
  {
    id: "automation",
    number: "02",
    title: "Business Automation Systems",
    summary: "WhatsApp-first booking, messaging and payment flows for businesses that run on one phone.",
    format: "Remote + on-site setup · 2–6 weeks",
    includes: ["Booking & inquiry flows", "GCash / payment links", "Staff training in their language"],
  },
  {
    id: "agents",
    number: "03",
    title: "AI Agent Deployment",
    summary: "Agents that answer, draft, schedule and escalate — built for unstable internet, with humans approving what matters.",
    format: "30-day pilot · then monthly",
    includes: ["Offline-tolerant queueing", "Human-in-the-loop approvals", "Monitoring + WhatsApp escalation"],
  },
  {
    id: "partnerships",
    number: "04",
    title: "Ecosystem Partnerships",
    summary: "For resorts, operators, landowners and builders who want to plug into shared logistics, agents and guests.",
    format: "Ongoing",
    includes: ["Shared boat & van runs", "Referrals across the network", "Co-development on selected sites"],
  },
];

export const inquiryFocusOptions = [
  "Resort & Land Development (Palawan)",
  "Business Automation Systems",
  "AI Agent Deployment",
  "Ecosystem Partnerships",
  "Something else",
] as const;

export const inquiryTimelineOptions = ["Now", "Next 3 months", "6–12 months", "Just exploring"] as const;

export const networkNodes: { name: string; detail: string; status: string }[] = [
  { name: "Site 01", detail: "Off-grid resort · Northern Palawan", status: "In build" },
  { name: "Automation desk", detail: "Local businesses · Puerto Princesa", status: "Online" },
  { name: "Agent ops", detail: "Remote · always on", status: "Online" },
  { name: "Logistics layer", detail: "Boats + vans · Taytay – El Nido", status: "Expanding" },
  { name: "Field Notes", detail: "Weekly · Sunday, Manila time", status: "Weekly" },
];
