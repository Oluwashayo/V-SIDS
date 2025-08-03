import type { SerwistConfig } from "serwist";

const config: SerwistConfig = {
  swSrc: "app/sw.ts",
  globDirectory: ".next",
  globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
};

export default config;