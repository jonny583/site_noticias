// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config.js";

export default defineConfig({
  site: SITE.url,
  trailingSlash: "always",
  integrations: [sitemap()],
  // Idiomas: hoje só português. Para incluir inglês depois,
  // acrescente "en" em locales e crie src/i18n/en.json.
  i18n: {
    defaultLocale: "pt",
    locales: ["pt"],
    routing: { prefixDefaultLocale: false },
  },
});
