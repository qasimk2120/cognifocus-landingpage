const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();
const outPath = path.join(root, "dist", "sitemap.xml");
const today = new Date().toISOString().slice(0, 10);
const posts = require(path.join(root, "src", "data", "blog", "posts.json"));

const blogRoutes = posts.map((post) => ({
  loc: post.canonical,
  source: path.join("src", "data", "blog", "posts.json"),
  lastmod: post.updatedDate || post.publishDate,
  changefreq: "monthly",
  priority: post.slug.includes("vs") ? "0.7" : "0.8",
}));

const routes = [
  {
    loc: "https://cognifocus.app/",
    source: "index.html",
    changefreq: "weekly",
    priority: "1.0",
  },
  {
    loc: "https://cognifocus.app/blog/",
    source: "src/pages/blog/index/index.astro",
    changefreq: "weekly",
    priority: "0.8",
  },
  ...blogRoutes,
  {
    loc: "https://cognifocus.app/pricing.html",
    source: "pricing.html",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://cognifocus.app/download.html",
    source: "download.html",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://cognifocus.app/ios-waitlist.html",
    source: "ios-waitlist.html",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://cognifocus.app/faq.html",
    source: "faq.html",
    changefreq: "monthly",
    priority: "0.7",
  },
  {
    loc: "https://cognifocus.app/whats-new.html",
    source: "src/pages/whats-new.astro",
    changefreq: "weekly",
    priority: "0.6",
  },
  {
    loc: "https://cognifocus.app/privacy.html",
    source: "privacy.html",
    changefreq: "yearly",
    priority: "0.3",
  },
  {
    loc: "https://cognifocus.app/terms.html",
    source: "terms.html",
    changefreq: "yearly",
    priority: "0.3",
  },
  {
    loc: "https://cognifocus.app/delete-account.html",
    source: "delete-account.html",
    changefreq: "yearly",
    priority: "0.3",
  },
];

function gitLastModified(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    return today;
  }

  try {
    const output = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", relativePath],
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();

    return output || today;
  } catch {
    return today;
  }
}

const seen = new Set();
const urlEntries = routes.map((route) => {
  if (seen.has(route.loc)) {
    throw new Error(`Duplicate sitemap URL: ${route.loc}`);
  }

  seen.add(route.loc);

  return [
    "  <url>",
    `    <loc>${route.loc}</loc>`,
    `    <lastmod>${route.lastmod || gitLastModified(route.source)}</lastmod>`,
    `    <changefreq>${route.changefreq}</changefreq>`,
    `    <priority>${route.priority}</priority>`,
    "  </url>",
    "",
  ].join("\n");
});

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "",
  ...urlEntries,
  "</urlset>",
  "",
].join("\n");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, sitemap, "utf8");

console.log(`Generated ${path.relative(root, outPath)}`);
