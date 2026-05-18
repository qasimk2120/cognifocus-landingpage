const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outPath = path.join(root, "dist", "feed.xml");
const posts = require(path.join(root, "src", "data", "blog", "posts.json"));

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toUtcDate(value) {
  return new Date(`${value}T00:00:00Z`).toUTCString();
}

const entries = [...posts]
  .sort((a, b) => (b.publishDate || "").localeCompare(a.publishDate || ""))
  .map((post) => {
    const lastmod = post.updatedDate || post.publishDate;

    return [
      "    <item>",
      `      <title>${escapeXml(post.articleTitle || post.title)}</title>`,
      `      <link>${escapeXml(post.canonical)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(post.canonical)}</guid>`,
      `      <description>${escapeXml(post.description)}</description>`,
      `      <pubDate>${toUtcDate(post.publishDate)}</pubDate>`,
      `      <lastBuildDate>${toUtcDate(lastmod)}</lastBuildDate>`,
      "    </item>",
      "",
    ].join("\n");
  });

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0">',
  "  <channel>",
  "    <title>CogniFocus Blog</title>",
  "    <link>https://cognifocus.app/blog/</link>",
  "    <description>CogniFocus blog articles about focus, app blocking, and distraction recovery.</description>",
  "    <language>en-us</language>",
  "    <ttl>60</ttl>",
  ...entries,
  "  </channel>",
  "</rss>",
  "",
].join("\n");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, feed, "utf8");

console.log(`Generated ${path.relative(root, outPath)}`);
