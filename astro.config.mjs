import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

function canonicalSitemap() {
  return {
    name: "canonical-sitemap",
    hooks: {
      async "astro:build:done"({ dir }) {
        const outDir = fileURLToPath(dir);
        await copyFile(join(outDir, "sitemap-0.xml"), join(outDir, "sitemap.xml"));
      },
    },
  };
}

export default defineConfig({
  site: "https://cognifocus.app",
  output: "static",
  integrations: [
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
    canonicalSitemap(),
  ],
  build: {
    format: "file",
  },
});
