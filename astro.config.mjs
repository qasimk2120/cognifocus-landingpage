import { defineConfig } from "astro/config";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import llms from "astro-llms-md";
import { copyFile, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

function canonicalSitemap() {
  return {
    name: "canonical-sitemap",
    hooks: {
      async "astro:build:done"({ dir }) {
        const outDir = fileURLToPath(dir);
        await copyFile(
          join(outDir, "sitemap-0.xml"),
          join(outDir, "sitemap.xml"),
        );
      },
    },
  };
}

function normalizeLlmsOutput() {
  return {
    name: "normalize-llms-output",
    hooks: {
      async "astro:build:done"({ dir }) {
        const outDir = fileURLToPath(dir);
        const rootMarkdownPath = join(outDir, ".md");
        const indexMarkdownPath = join(outDir, "index.md");
        const llmsPath = join(outDir, "llms.txt");

        try {
          await rename(rootMarkdownPath, indexMarkdownPath);
        } catch (error) {
          if (error?.code !== "ENOENT") {
            throw error;
          }
        }

        const llmsContent = await readFile(llmsPath, "utf8");
        await writeFile(
          llmsPath,
          llmsContent.replaceAll(
            "https://cognifocus.app/.md",
            "https://cognifocus.app/index.md",
          ),
          "utf8",
        );
      },
    },
  };
}

export default defineConfig({
  site: "https://cognifocus.app",
  output: "static",
  integrations: [
    icon(),
    sitemap({
      serialize(item) {
        const url = new URL(item.url);

        if (url.pathname.endsWith("/index")) {
          url.pathname = `${url.pathname.slice(0, -"/index".length)}/`;
        } else if (url.pathname !== "/" && !url.pathname.endsWith(".html")) {
          url.pathname = `${url.pathname}.html`;
        }

        item.url = url.href;
        return item;
      },
    }),
    robotsTxt({
      sitemap: "https://cognifocus.app/sitemap.xml",
      policy: [
        {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/drafts/",
            "/internal/",
            "/dev/",
            "/test/",
            "/tmp/",
            "/private/",
          ],
        },
      ],
    }),
    llms({
      siteUrl: "https://cognifocus.app",
      name: "CogniFocus",
      description:
        "CogniFocus is a focus app that reacts when you lose focus. It combines a focus timer, Distraction Shield, Goblin companion reactions, app blocking, planned sessions, progress/XP, Android availability, and an iOS waitlist.",
      generateIndividualMd: true,
      generateLlmsTxt: true,
      generateLlmsFullTxt: true,
      contentSelector: "main",
      exclude: [
        "404",
        "404.html",
        "_astro/**",
        "**.xml",
        "**.txt",
        "node_modules/**",
        "../dist/blog/category/**",
        "../dist/blog/page/**",
        "../dist/drafts/**",
        "../dist/internal/**",
        "../dist/dev/**",
        "../dist/test/**",
        "../dist/tmp/**",
        "../dist/private/**",
        "../dist/65d81f7e-5f51-4ef1-a418-793bf1219721.html",
      ],
    }),
    normalizeLlmsOutput(),
    canonicalSitemap(),
  ],
  build: {
    format: "file",
  },
});
