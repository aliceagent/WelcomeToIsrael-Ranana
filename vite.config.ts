import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { IncomingMessage, ServerResponse } from "node:http";

function askApiPlugin(): Plugin {
  return {
    name: "ask-api",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url?.split("?")[0] || "";
        if (url !== "/api/ask") {
          next();
          return;
        }
        try {
          const { handleAsk } = await server.ssrLoadModule("/src/server/handle-ask.ts");
          const { nodeToWebRequest, webToNodeResponse } = await server.ssrLoadModule("/src/server/node-http.ts");
          const origin = `http://${req.headers.host || "localhost:5173"}`;
          const request = await nodeToWebRequest(req, origin);
          const response = await handleAsk(request);
          await webToNodeResponse(response, res);
        } catch (err) {
          console.error(err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "ask_failed" }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of ["MOONSHOT_API_KEY", "KIMI_API_KEY", "KIMI_MODEL", "MOONSHOT_MODEL"]) {
    if (env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [
      askApiPlugin(),
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
          navigateFallbackDenylist: [/^\/og\//, /^\/api\//],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
      }),
    ],
    build: { target: "es2020" },
  };
});
