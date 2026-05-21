import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    outDir:        "dist",
    sourcemap:     false,
    minify:        "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor libs for better caching
        manualChunks: {
          react:    ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});
