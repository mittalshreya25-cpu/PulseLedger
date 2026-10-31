import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/safe-to-spend": "http://localhost:8000",
      "/transactions": "http://localhost:8000",
      "/ingest": "http://localhost:8000",
      "/rules": "http://localhost:8000",
      "/profile": "http://localhost:8000",
      "/balance": "http://localhost:8000",
      "/categories": "http://localhost:8000",
      "/recurring": "http://localhost:8000",
      "/simulate": "http://localhost:8000",
      "/solver": "http://localhost:8000",
      "/nudges": "http://localhost:8000",
      "/report": "http://localhost:8000",
      "/coach": "http://localhost:8000",
      "/integrity": "http://localhost:8000",
    },
  },
});

