"use client";

import { EntityPanel, type Row } from "./panels-entity";
import type { Field } from "./panels-entity";

/* ------------------------------------------------------------------ */
/* Stories (dispatches)                                                 */
/* ------------------------------------------------------------------ */

const storyFields: Field[] = [
  { k: "text", key: "title", label: "Title" },
  { k: "text", key: "slug", label: "Slug", hint: "URL — /stories/your-slug" },
  { k: "area", key: "dek", label: "Dek (one-line summary)", rows: 2 },
  { k: "image", key: "coverImage", label: "Cover image" },
  { k: "text", key: "coverAlt", label: "Cover alt text", hint: "Describe the photo for screen readers + SEO." },
  { k: "text", key: "category", label: "Category" },
  { k: "text", key: "location", label: "Location" },
  { k: "num", key: "dispatchNo", label: "Dispatch number" },
  { k: "num", key: "readingMinutes", label: "Reading minutes" },
  { k: "date", key: "publishedAt", label: "Published" },
  { k: "blocks", key: "body", label: "Story body" },
];

export function StoriesPanel() {
  return (
    <EntityPanel
      config={{
        endpoint: "/api/admin/stories",
        title: "Stories",
        sub: "Dispatches shown on Home, /stories and the RSS feed.",
        singular: "story",
        fields: storyFields,
        defaults: () => ({
          title: "",
          slug: "",
          dek: "",
          category: "Build",
          location: "Palawan, Philippines",
          readingMinutes: 4,
          coverImage: "/images/story-crew.jpg",
          coverAlt: "",
          body: [{ type: "p", text: "" }],
          featured: false,
          publishedAt: new Date().toISOString(),
        }),
        rowTitle: (r) => String(r.title || "Untitled"),
        rowMeta: (r) => `#${r.dispatchNo} · ${r.category} · /stories/${r.slug}`,
        rowFlag: { key: "featured", label: "Feature this story" },
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Built environments                                                   */
/* ------------------------------------------------------------------ */

const buildFields: Field[] = [
  { k: "text", key: "title", label: "Title" },
  { k: "text", key: "slug", label: "Slug", hint: "URL — /built/your-slug" },
  { k: "text", key: "status", label: "Status" },
  { k: "num", key: "position", label: "Order" },
  { k: "text", key: "tags", label: "Tags", hint: "Comma separated." },
  { k: "text", key: "location", label: "Location" },
  { k: "text", key: "since", label: "Since" },
  { k: "text", key: "fieldSpec", label: "Field spec line" },
  { k: "area", key: "summary", label: "Summary", rows: 3 },
  { k: "image", key: "image", label: "Image" },
  { k: "text", key: "imageAlt", label: "Image alt text" },
  { k: "kv", key: "specs", label: "Spec rows", hint: "Label + value pairs shown on the detail page." },
  { k: "sections", key: "sections", label: "Body sections" },
  { k: "list", key: "relatedStories", label: "Related story slugs", placeholder: "story-slug" },
];

export function BuiltPanel() {
  return (
    <EntityPanel
      config={{
        endpoint: "/api/admin/builds",
        title: "Built",
        sub: "Environments shown on Home and /built.",
        singular: "build",
        fields: buildFields,
        defaults: () => ({
          title: "",
          slug: "",
          tags: "",
          status: "In build",
          location: "Northern Palawan",
          since: "",
          summary: "",
          fieldSpec: "",
          image: "/images/built-resort.jpg",
          imageAlt: "",
          specs: [],
          sections: [],
          relatedStories: [],
        }),
        rowTitle: (r) => String(r.title || "Untitled"),
        rowMeta: (r) => `${r.status} · ${r.location} · /built/${r.slug}`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Palawan guides                                                       */
/* ------------------------------------------------------------------ */

const guideFields: Field[] = [
  { k: "text", key: "title", label: "Title" },
  { k: "text", key: "slug", label: "Slug", hint: "URL — /palawan/your-slug" },
  { k: "text", key: "kicker", label: "Kicker" },
  { k: "num", key: "position", label: "Order" },
  { k: "date", key: "verifiedAt", label: "Verified on" },
  { k: "area", key: "summary", label: "Summary", rows: 3 },
  { k: "image", key: "image", label: "Image" },
  { k: "text", key: "imageAlt", label: "Image alt text" },
  { k: "list", key: "quickFacts", label: "Quick facts", placeholder: "e.g. 45 min by tricycle" },
  { k: "sections", key: "sections", label: "Guide sections", withItems: true },
];

export function PalawanPanel() {
  return (
    <EntityPanel
      config={{
        endpoint: "/api/admin/guides",
        title: "Palawan",
        sub: "Practical guides shown on Home and /palawan.",
        singular: "guide",
        fields: guideFields,
        defaults: () => ({
          title: "",
          slug: "",
          kicker: "",
          summary: "",
          image: "/images/guide-untold.jpg",
          imageAlt: "",
          quickFacts: [],
          sections: [],
          verifiedAt: new Date().toISOString(),
        }),
        rowTitle: (r) => String(r.title || "Untitled"),
        rowMeta: (r) => `${r.kicker || "guide"} · /palawan/${r.slug}`,
      }}
    />
  );
}

/** Re-exported so the console can type the shared row shape. */
export type { Row };
