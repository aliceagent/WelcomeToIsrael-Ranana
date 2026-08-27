import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "og/**/*.png"],
      manifest: {
        name: "Welcome to Ra'anana",
        short_name: "Ra'anana",
        description:
          "Living guide for new families in Ra'anana. English, French and Hebrew. Works offline.",
        theme_color: "#1c4a3c",
        background_color: "#f4efe4",
        display: "standalone",
        start_url: "/",
        lang: "en",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,json}", "icon-*.png", "apple-touch-icon.png"],
        globIgnores: ["og/**", "e/**", "c/**", "**/sitemap.xml"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/og\//],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  build: { target: "es2020" },
});
