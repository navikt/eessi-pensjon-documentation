import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { configFromEnv, createHandler } from "./server/server.mjs";

// Runs the production request handler (server/server.mjs) inside the Vite dev
// server for /api/*, so `npm run dev` alone gives /api/me and the proxy to
// eessi-pensjon-documentation-api (default http://localhost:8080).
function documentationApi(): Plugin {
  return {
    name: "documentation-api",
    configureServer(server) {
      const handler = createHandler(configFromEnv());
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/")) void handler(req, res);
        else next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), documentationApi()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
});
