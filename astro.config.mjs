import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://cognifocus.app",
  output: "static",
  integrations: [
    sitemap({
      serialize(item) {
        const url = new URL(item.url);

        if (url.pathname === "/blog/index") {
          url.pathname = "/blog/";
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
