import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
/**
 * Configuração do Vite para o frontend LouvorFlow.
 *
 * Define servidor de desenvolvimento com proxy para a API, plugin React SWC e alias de importação.
 */
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
