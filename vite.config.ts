import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// TODO: Bundle optimization - implement code splitting when bundle exceeds 500kb threshold:
// - Use React.lazy() for route-level code splitting (CharacterDetailPage, BillingPage, etc.)
// - Configure build.rollupOptions.output.manualChunks for vendor separation
// - Consider dynamic imports for heavy components (pose grid, credit ledger)
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3005,
    proxy: {
      // Proxy API requests to the backend server
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
}));
