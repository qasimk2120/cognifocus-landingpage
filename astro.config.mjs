import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://cognifocus.app",
  output: "static",
  build: {
    format: "file",
  },
});
