import rss from "@astrojs/rss";
import posts from "../data/blog/posts.json";

const toUtcDate = (value) => new Date(`${value}T00:00:00Z`);

export function GET(context) {
  const sortedPosts = [...posts].sort((a, b) =>
    (b.publishDate || "").localeCompare(a.publishDate || ""),
  );

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
