import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
  ],
  build: {
    format: "file",
  },
});
