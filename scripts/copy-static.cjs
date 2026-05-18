const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outDir = path.join(root, "dist");

const rootFiles = [
  ".nojekyll",
  "5d92378c81d742eaaeb60c8fb8bbdcb5.txt",
  "65d81f7e-5f51-4ef1-a418-793bf1219721.html",
  "CNAME",
  "delete-account.css",
  "delete-account.html",
  "download.css",
  "download.html",
  "download.js",
  "faq.css",
  "index.html",
  "ios-waitlist.css",
  "ios-waitlist.html",
  "ios-waitlist.js",
  "llms.txt",
  "local-static-server.cjs",
  "pricing.css",
  "pricing.html",
  "privacy.css",
  "privacy.html",
  "robots.txt",
  "script-confirmation.js",
  "script.js",
  "seo-pages.css",
  "shared.js",
  "style.css",
  "terms.css",
  "terms.html",
  "updates.json",
  "whats-new.css",
  "whats-new.html",
  "whats-new.js",
];

const rootDirs = [".well-known", "assets", "blog"];

function copyFile(relativePath) {
  const from = path.join(root, relativePath);
  const to = path.join(outDir, relativePath);

  if (!fs.existsSync(from)) return;

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(relativePath) {
  const from = path.join(root, relativePath);
  const to = path.join(outDir, relativePath);

  if (!fs.existsSync(from)) return;

  fs.cpSync(from, to, {
    recursive: true,
    force: true,
    filter: (source) => {
      const relativeSource = path.relative(root, source);
      if (
        relativeSource.startsWith(`blog${path.sep}`) &&
        relativeSource.endsWith(".html")
      ) {
        return false;
      }
      return !source.endsWith(`${path.sep}.DS_Store`);
    },
  });
}

rootDirs.forEach(copyDir);
rootFiles.forEach((file) => {
  if (
    file === "faq.html" ||
    file === "privacy.html" ||
    file === "terms.html" ||
    file === "delete-account.html" ||
    file === "pricing.html" ||
    file === "download.html" ||
    file === "ios-waitlist.html" ||
    file === "whats-new.html" ||
    file === "index.html"
  ) {
    return;
  }
  copyFile(file);
});

console.log(
  "Copied existing static site files into dist without overwriting Astro pages.",
);
