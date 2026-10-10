import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // The preview tooling assigns a free port through PORT when 5173 is taken;
    // plain `npm run dev` keeps Vite's default.
    port: Number(process.env.PORT) || 5173,
    proxy: {
      "/alchemize-api.php": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false,
      },
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false,
      },
    },
  },
});
