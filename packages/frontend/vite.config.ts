import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: process.env.HOST ?? "::",
    port: parseInt(process.env.PORT ?? "8080", 10),
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? 3000}`,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
