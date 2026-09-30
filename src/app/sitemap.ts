import type { MetadataRoute } from "next";
import { getBuilds, getGuides, getStories } from "@/lib/data";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, builds, guides] = await Promise.all([getStories(), getBuilds(), getGuides()]);
  const base = site.url;

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/stories`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/palawan`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/built`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/work-with-us`, changeFrequency: "monthly", priority: 0.6 },
    ...stories.map((s) => ({
      url: `${base}/stories/${s.slug}`,
      lastModified: s.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...guides.map((g) => ({
      url: `${base}/palawan/${g.slug}`,
      lastModified: g.verifiedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...builds.map((b) => ({
      url: `${base}/built/${b.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
