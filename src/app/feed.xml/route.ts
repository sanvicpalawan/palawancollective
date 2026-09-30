import { getStories } from "@/lib/data";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const stories = await getStories();
  const items = stories
    .map((story) => {
      const url = `${site.url}/stories/${story.slug}`;
      return [
        "<item>",
        `<title>${escapeXml(story.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${story.publishedAt.toUTCString()}</pubDate>`,
        `<category>${escapeXml(story.category)}</category>`,
        `<description>${escapeXml(story.dek)}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Palawan Collective — Field Notes</title><link>${site.url}</link><description>${escapeXml(site.positioning)}</description><language>en</language>${items}</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
