import rss from "@astrojs/rss";
import { getSortedPosts } from "../utils/blog.js";

const toUtcDate = (value) => {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return new Date("1970-01-01T00:00:00Z");
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00Z`)
    : new Date(normalized);

  return Number.isNaN(parsed.getTime())
    ? new Date("1970-01-01T00:00:00Z")
    : parsed;
};

export async function GET(context) {
  const sortedPosts = await getSortedPosts();

  return rss({
    title: "CogniFocus Blog",
    description:
      "CogniFocus blog articles about focus, app blocking, and distraction recovery.",
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.articleTitle || post.title,
      link: post.canonical,
      description: post.description,
      pubDate: toUtcDate(post.publishDate),
      customData: `<guid isPermaLink="true">${post.canonical}</guid>`,
    })),
    customData: "<language>en-us</language><ttl>60</ttl>",
  });
}
