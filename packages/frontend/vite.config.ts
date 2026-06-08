import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import viteCompression from "vite-plugin-compression";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), viteCompression()],

  base: "/",

  build: {
    chunkSizeWarningLimit: 600,
    outDir: "dist",
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    // Proxy /api requests to Node.js backend during development
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        // Don't rewrite the /api prefix
      },
    },
    // Port for dev server
    port: 5173,
  },
});
